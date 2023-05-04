import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeFiChainTransactionStatus, EthereumQueue, EthereumTransactionStatus, QueueStatus } from '@prisma/client';
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

  private readonly DAYS_TO_EXPIRY = 3;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private configService: ConfigService,
    private verificationService: VerificationService,
    private prisma: PrismaService,
  ) {
    this.network = this.configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
    this.contractAddress = this.configService.getOrThrow('ethereum.contracts.queueBridgeProxy.address');
    this.contract = BridgeV1__factory.connect(this.contractAddress, this.ethersRpcProvider);
  }

  async createQueueTransaction(transactionHash: string): Promise<EthereumQueue> {
    try {
      const txHashFound = await this.prisma.ethereumQueue.findFirst({
        where: {
          transactionHash,
        },
      });
      if (txHashFound) {
        throw new Error('Transaction Hash already exists');
      }

      const { parsedTxnData, ErrorMsg } = await this.verificationService.verifyIfValidTxn(
        transactionHash,
        this.contractAddress,
        ContractType.queue,
      );

      if (!parsedTxnData) throw new Error(ErrorMsg);

      const onChainTxnDetail = await this.ethersRpcProvider.getTransaction(transactionHash);
      const { params } = this.verificationService.decodeTxnData(parsedTxnData);
      const { _defiAddress: defiAddress, _tokenAddress: tokenAddress, _amount: amount } = params;

      const toAddress = ethers.utils.toUtf8String(defiAddress);

      let transferAmount = new BigNumber(0);
      let dTokenDetails;

      // expiry date calculations
      const currDate = new Date();
      const expiryDate = new Date(currDate.setDate(currDate.getDate() + this.DAYS_TO_EXPIRY));
      expiryDate.setUTCHours(0, 0, 0, 0); // set to UTC +0

      // eth transfer
      if (tokenAddress === ethers.constants.AddressZero) {
        const ethAmount = EthBigNumber.from(onChainTxnDetail.value).toString();
        transferAmount = new BigNumber(ethAmount).dividedBy(new BigNumber(10).pow(18));
        dTokenDetails = getDTokenDetailsByWToken('ETH', this.network);
      } else {
        // wToken transfer
        const evmTokenContract = new ethers.Contract(tokenAddress, ERC20__factory.abi, this.ethersRpcProvider);
        const wTokenSymbol = await evmTokenContract.symbol();
        const wTokenDecimals = await evmTokenContract.decimals();
        transferAmount = new BigNumber(amount).dividedBy(new BigNumber(10).pow(wTokenDecimals));
        dTokenDetails = getDTokenDetailsByWToken(wTokenSymbol, this.network);
      }

      const queueRecord = await this.prisma.ethereumQueue.create({
        data: {
          transactionHash,
          status: QueueStatus.DRAFT,
          ethereumStatus: EthereumTransactionStatus.NOT_CONFIRMED,
          amount: transferAmount.toString(),
          defichainAddress: toAddress,
          expiryDate,
          tokenSymbol: dTokenDetails.symbol,
        },
      });
      return queueRecord;
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
      const { parsedTxnData, ErrorMsg } = await this.verificationService.verifyIfValidTxn(
        transactionHash,
        this.contractAddress,
        ContractType.queue,
      );

      if (!parsedTxnData) throw new Error(ErrorMsg);

      const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);

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

      if (!txHashFound) {
        throw new Error('Transaction Hash does not exist');
      }

      if (txHashFound.status === QueueStatus.DRAFT) {
        const adminQueueTxn = await this.prisma.adminEthereumQueue.findFirst({
          where: {
            queueTransactionHash: transactionHash,
          },
        });
        if (adminQueueTxn) {
          throw new Error('Transaction Hash already exists in admin table');
        }

        await this.prisma.$transaction(async (prisma) => {
          await prisma.ethereumQueue.update({
            where: {
              transactionHash,
            },
            data: {
              ethereumStatus: EthereumTransactionStatus.CONFIRMED,
              status: QueueStatus.IN_PROGRESS,
            },
          });

          await prisma.adminEthereumQueue.create({
            data: {
              queueTransactionHash: transactionHash,
              defichainStatus: DeFiChainTransactionStatus.NOT_CONFIRMED,
            },
          });
        });
      }

      if (txHashFound.ethereumStatus !== EthereumTransactionStatus.CONFIRMED) {
        return {
          numberOfConfirmations,
          isConfirmed: false,
        };
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
