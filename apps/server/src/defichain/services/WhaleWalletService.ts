import { fromAddress } from '@defichain/jellyfish-address';
import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeFiChainAddressIndex } from '@prisma/client';
import { EnvironmentNetwork, getJellyfishNetwork } from '@waveshq/walletkit-core';
import BigNumber from 'bignumber.js';

import { SupportedDFCTokenSymbols } from '../../AppConfig';
import { CustomErrorCodes } from '../../CustomErrorCodes';
import { EVMTransactionConfirmerService } from '../../ethereum/services/EVMTransactionConfirmerService';
import { PrismaService } from '../../PrismaService';
import { TokenSymbol, VerifyObject } from '../model/VerifyDto';
import { WhaleApiClientProvider } from '../providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from '../providers/WhaleWalletProvider';
import { SendService } from './SendService';

@Injectable()
export class WhaleWalletService {
  private readonly logger: Logger;

  constructor(
    private readonly whaleWalletProvider: WhaleWalletProvider,
    private readonly clientProvider: WhaleApiClientProvider,
    private readonly evmTransactionService: EVMTransactionConfirmerService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private readonly sendService: SendService,
  ) {
    this.logger = new Logger(WhaleWalletService.name);
  }

  async verify(verify: VerifyObject, network: EnvironmentNetwork): Promise<VerifyResponse> {
    this.logger.log(`[Verify] ${verify.amount} ${verify.symbol} ${verify.address} ${verify.ethReceiverAddress}`);

    // Verify if the address is valid
    const { isAddressValid } = this.verifyValidAddress(verify.address, network);
    if (!isAddressValid) {
      return { isValid: false, statusCode: CustomErrorCodes.AddressNotValid };
    }

    // Verify if amount > 0
    if (new BigNumber(verify.amount).isLessThanOrEqualTo(0)) {
      return { isValid: false, statusCode: CustomErrorCodes.AmountNotValid };
    }

    // Verify if decimal places is maximum 5
    const dp = new BigNumber(verify.amount).dp();
    if (dp != null && dp > 5) {
      return { isValid: false, statusCode: CustomErrorCodes.AmountNotValid };
    }

    try {
      // Verify if token symbol is supported
      const supportedDfcTokens = this.configService.getOrThrow('defichain.supportedTokens');
      const supportedTokensArray = supportedDfcTokens.split(',') as Array<keyof typeof SupportedDFCTokenSymbols>;
      if (!supportedTokensArray.includes(verify.symbol)) {
        return { isValid: false, statusCode: CustomErrorCodes.TokenSymbolNotSupported };
      }

      const pathIndex = await this.prisma.deFiChainAddressIndex.findFirst({
        where: {
          address: verify.address,
        },
        orderBy: [{ index: 'desc' }],
      });

      // Address not found
      if (pathIndex === null) {
        return { isValid: false, statusCode: CustomErrorCodes.AddressNotFound };
      }

      // Verify that the address is owned by the wallet
      const wallet = this.whaleWalletProvider.createWallet(Number(pathIndex.index));
      const address = await wallet.getAddress();

      if (address !== verify.address) {
        return { isValid: false, statusCode: CustomErrorCodes.AddressNotOwned };
      }

      const utxo = await wallet.client.address.getBalance(address);
      const tokens = await wallet.client.address.listToken(address);
      const token = tokens.find((t) => t.symbol === verify.symbol.toString());

      // If no amount has been received yet for DFI
      if (verify.symbol === TokenSymbol.DFI && new BigNumber(utxo).isZero()) {
        return { isValid: false, statusCode: CustomErrorCodes.IsZeroBalance };
      }

      // If no amount has been received yet for other tokens
      if ((token === undefined || new BigNumber(token?.amount).isZero()) && verify.symbol !== TokenSymbol.DFI) {
        return { isValid: false, statusCode: CustomErrorCodes.IsZeroBalance };
      }

      // Verify that the amount === token balance
      if (token !== undefined && !new BigNumber(verify.amount).isEqualTo(token.amount)) {
        return { isValid: false, statusCode: CustomErrorCodes.BalanceNotMatched };
      }

      // Successful verification, proceed to sign the claim
      const fee = new BigNumber(verify.amount).multipliedBy(this.configService.getOrThrow('defichain.transferFee'));
      const amountLessFee = BigNumber.max(verify.amount.minus(fee), 0).toFixed(6, BigNumber.ROUND_FLOOR);

      const claim = await this.evmTransactionService.signClaim({
        receiverAddress: verify.ethReceiverAddress,
        tokenAddress: verify.tokenAddress,
        tokenSymbol: verify.symbol,
        amount: amountLessFee,
        uniqueDfcAddress: verify.address,
      });

      await this.fundUTXO(verify.address);

      this.logger.log(
        `[Verify SUCCESS] ${verify.amount} ${fee.toString()} ${amountLessFee} ${verify.symbol} ${verify.address} ${
          verify.ethReceiverAddress
        }`,
      );

      return { isValid: true, signature: claim.signature, nonce: claim.nonce, deadline: claim.deadline };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'There is a problem in verifying the address',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error as Error,
          description: `[Verify ERROR] ${verify.amount} ${verify.symbol} ${verify.address} ${verify.ethReceiverAddress}`,
        },
      );
    }
  }

  async generateAddress(
    refundAddress: string,
    network: EnvironmentNetwork,
  ): Promise<Pick<DeFiChainAddressIndex, 'address' | 'createdAt' | 'refundAddress'>> {
    try {
      this.logger.log(`[GA] ${refundAddress}`);
      const hotWallet = this.whaleWalletProvider.getHotWallet();
      const hotWalletAddress = await hotWallet.getAddress();
      const decodedAddress = fromAddress(refundAddress, this.clientProvider.remapNetwork(network));
      if (decodedAddress === undefined) {
        throw new BadRequestException(`Invalid refund address for DeFiChain ${network}`);
      }
      const lastIndex = await this.prisma.deFiChainAddressIndex.findFirst({
        where: {
          hotWalletAddress,
        },
        orderBy: [{ index: 'desc' }],
      });
      const index = lastIndex?.index;
      const nextIndex = index ? index + 1 : 2;
      const wallet = this.whaleWalletProvider.createWallet(nextIndex);
      const address = await wallet.getAddress();
      const data = await this.prisma.deFiChainAddressIndex.create({
        data: {
          index: nextIndex,
          address,
          refundAddress,
          hotWalletAddress,
        },
      });

      this.logger.log(`[GA SUCCESS] ${refundAddress} ${data.address} ${nextIndex}`);
      return {
        address: data.address,
        createdAt: data.createdAt,
        refundAddress: data.refundAddress,
      };
    } catch (e: any) {
      this.logger.error(`[GA ERROR] ${refundAddress} ${network}`, e);
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'There is a problem in generating an address',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }

  async getAddressDetails(
    address: string,
  ): Promise<Pick<DeFiChainAddressIndex, 'address' | 'createdAt' | 'refundAddress'>> {
    try {
      const data = await this.prisma.deFiChainAddressIndex.findFirst({
        where: {
          address,
        },
        select: {
          address: true,
          refundAddress: true,
          createdAt: true,
        },
      });
      if (!data) {
        throw new Error('Address detail not available');
      }
      return data;
    } catch (e: any) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'There is a problem in fetching an address',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }

  async getBalance(tokenSymbol: SupportedDFCTokenSymbols): Promise<string> {
    if (!SupportedDFCTokenSymbols[tokenSymbol]) {
      throw new BadRequestException(`Token: "${tokenSymbol}" is not supported`);
    }
    const hotWallet = await this.whaleWalletProvider.getHotWallet();
    const hotWalletAddress = await hotWallet.getAddress();

    if (tokenSymbol === SupportedDFCTokenSymbols.DFI) {
      return hotWallet.client.address.getBalance(hotWalletAddress);
    }

    const tokens = await hotWallet.client.address.listToken(hotWalletAddress);
    const token = tokens.find((t) => t.symbol === SupportedDFCTokenSymbols[tokenSymbol]);

    if (token === undefined) {
      return '0';
    }
    return token.amount;
  }

  private verifyValidAddress(address: string, network: EnvironmentNetwork): { isAddressValid: boolean } {
    const decodedAddress = fromAddress(address, getJellyfishNetwork(network).name);
    return { isAddressValid: decodedAddress !== undefined };
  }

  // This function will top up UTXO on a successful signing of DFC -> EVM claim
  private async fundUTXO(toAddress: string): Promise<void> {
    try {
      const dustUTXO = this.configService.get('defichain.dustUTXO', 0.001);
      this.logger.log(`[Sending UTXO] to ${toAddress}...`);
      const sendTransactionHash = await this.sendService.send(toAddress, {
        symbol: 'DFI',
        id: '0',
        amount: new BigNumber(dustUTXO),
      });
      this.logger.log(`[Sent UTXO] to ${toAddress} ${sendTransactionHash}`);
    } catch (e) {
      this.logger.log(`[Sent UTXO] Failed to send ${toAddress}. Check UTXO balance.`);
    }
  }
}

export interface VerifyResponse {
  isValid: boolean;
  statusCode?: CustomErrorCodes;
  signature?: string;
  nonce?: number;
  deadline?: number;
}
