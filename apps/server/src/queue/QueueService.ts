import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeFiChainTransactionStatus, EthereumTransactionStatus, QueueStatus } from '@prisma/client';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import BigNumber from 'bignumber.js';
import { BigNumber as EthBigNumber, ethers } from 'ethers';
import { BridgeV1, BridgeV1__factory, ERC20__factory } from 'smartcontracts';

import { ContractType, VerificationService } from '../ethereum/services/VerificationService';
import { ETHERS_RPC_PROVIDER } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { getDTokenDetailsByWToken } from '../utils/TokensUtils';
import { VerifyQueueTransactionDto } from './QueueDto';

@Injectable()
export class QueueService {
  private contract: BridgeV1;

  private contractAddress: string;

  private network: EnvironmentNetwork;

  private readonly MIN_REQUIRED_EVM_CONFIRMATION = 65;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private configService: ConfigService,
    private verficationService: VerificationService,
    private prisma: PrismaService,
  ) {
    this.network = this.configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
    this.contractAddress = this.configService.getOrThrow('ethereum.contracts.queueBridgeProxy.address');
    this.contract = BridgeV1__factory.connect(this.contractAddress, this.ethersRpcProvider);
  }

  async createQueueTransaction(transactionHash: string): Promise<string> {
    try {
      const isValidTxn = this.verficationService.verifyIfValidTxn(transactionHash, ContractType.queue);

      const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);
      const onChainTxnDetail = await this.ethersRpcProvider.getTransaction(transactionHash);
      const parsedTxnData = await this.verficationService.parseTxnHash(transactionHash, ContractType.queue);
      const { params } = this.verficationService.decodeTxnData(parsedTxnData);
      const { _defiAddress: defiAddress, _tokenAddress: tokenAddress, _amount: amount } = params;

      const toAddress = ethers.utils.toUtf8String(defiAddress);

      let transferAmount = new BigNumber(0);
      let dTokenDetails;

      // eth transfer
      if (tokenAddress === ethers.constants.AddressZero) {
        const ethAmount = EthBigNumber.from(onChainTxnDetail.value).toString();
        transferAmount = new BigNumber(ethAmount).dividedBy(new BigNumber(10).pow(18));
        dTokenDetails = getDTokenDetailsByWToken('ETH', this.network);
      }
      // wToken transfer
      const evmTokenContract = new ethers.Contract(tokenAddress, ERC20__factory.abi, this.ethersRpcProvider);
      const wTokenSymbol = await evmTokenContract.symbol();
      const wTokenDecimals = await evmTokenContract.decimals();
      transferAmount = new BigNumber(amount).dividedBy(new BigNumber(10).pow(wTokenDecimals));
      dTokenDetails = getDTokenDetailsByWToken(wTokenSymbol, this.network);
      // expiry date
      const currentDate = new Date();
      const expiryDate = currentDate.setDate(currentDate.getDate() + 3);

      // if transaction is still pending
      if (txReceipt === null) {
        return `${transactionHash} is still pending`;
      }

      // Sanity check that the contractAddress, decoded name and signature are correct
      if (txReceipt.to !== this.contractAddress || !isValidTxn) {
        return `${txReceipt.to}, decoded name and signature is inaccurate`;
      }

      // if transaction is reverted
      const isReverted = txReceipt.status === 0;
      if (isReverted === true) {
        throw new BadRequestException(`Transaction Reverted`);
      }

      await this.prisma.ethereumQueue.create({
        data: {
          transactionHash,
          status: QueueStatus.DRAFT,
          ethereumStatus: EthereumTransactionStatus.NOT_CONFIRMED,
          amount: new BigNumber(transferAmount).toString(),
          defichainAddress: toAddress,
          expiryDate: new Date(expiryDate),
          tokenSymbol: dTokenDetails.symbol,
        },
      });
      return `Draft queue transaction created for ${transactionHash}`;
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `API call for create Queue transaction was unsuccessful: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }

  async verify(transactionHash: string): Promise<VerifyQueueTransactionDto> {
    try {
      const isValidTxn = await this.verficationService.verifyIfValidTxn(transactionHash, ContractType.queue);
      const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);

      // if transaction is still pending
      if (txReceipt === null) {
        return { numberOfConfirmations: 0, isConfirmed: false };
      }

      // Sanity check that the contractAddress, decoded name and signature are correct
      if (txReceipt.to !== this.contractAddress || !isValidTxn) {
        return { numberOfConfirmations: 0, isConfirmed: false };
      }

      // if transaction is reverted
      const isReverted = txReceipt.status === 0;
      if (isReverted === true) {
        throw new BadRequestException(`Transaction Reverted`);
      }

      const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
      const numberOfConfirmations = BigNumber.max(currentBlockNumber - txReceipt.blockNumber, 0).toNumber();

      if (numberOfConfirmations < this.MIN_REQUIRED_EVM_CONFIRMATION) {
        return { numberOfConfirmations, isConfirmed: false };
      }

      const txHashFound = await this.prisma.ethereumQueue.findFirst({
        where: {
          transactionHash,
        },
      });

      if (txHashFound?.status === QueueStatus.DRAFT) {
        await this.prisma.ethereumQueue.update({
          where: {
            transactionHash,
          },
          data: {
            ethereumStatus: EthereumTransactionStatus.CONFIRMED,
            status: QueueStatus.IN_PROGRESS,
          },
        });
      } else {
        throw new Error('Queue status is not DRAFT & may be further down the approval flow');
      }

      const adminQueueTxn = await this.prisma.adminEthereumQueue.findFirst({
        where: {
          queueTransactionHash: transactionHash,
        },
      });
      if (adminQueueTxn === null) {
        await this.prisma.adminEthereumQueue.create({
          data: {
            queueTransactionHash: transactionHash,
            defichainStatus: DeFiChainTransactionStatus.NOT_CONFIRMED,
          },
        });
      }

      return { numberOfConfirmations, isConfirmed: true };
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `API call for verify was unsuccessful: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}
