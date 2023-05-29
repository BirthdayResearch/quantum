import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueStatus } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import { ETHERS_RPC_PROVIDER } from '../../../modules/EthersModule';
import { PrismaService } from '../../../PrismaService';
import { ContractType, ErrorMsgTypes, VerificationService } from '../../services/VerificationService';

@Injectable()
export class RefundService {
  private readonly contractAddress: string;

  private readonly MIN_REQUIRED_EVM_CONFIRMATION = 65;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private verificationService: VerificationService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.contractAddress = this.configService.getOrThrow('ethereum.contracts.queueBridgeProxy.address');
  }

  async requestQueueRefund(transactionHash: string) {
    try {
      const queue = await this.prisma.ethereumQueue.findFirst({
        where: {
          transactionHash,
        },
      });

      // Check if queue exists
      if (!queue) {
        throw new BadRequestException(ErrorMsgTypes.QueueNotFound);
      }

      if (queue.status !== QueueStatus.EXPIRED) {
        throw new BadRequestException('Unable to request refund for queue');
      }

      await this.verificationService.verifyIfValidTxn(transactionHash, this.contractAddress, ContractType.queue);
      const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);
      const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
      const numberOfConfirmations = BigNumber.max(currentBlockNumber - txReceipt.blockNumber, 0).toNumber();

      // Check if 65 confirmations is completed in evm
      if (numberOfConfirmations < this.MIN_REQUIRED_EVM_CONFIRMATION) {
        throw new BadRequestException(
          'Transaction has not been processed, did not complete 65 confirmations for EVM unable to proceed with refund request',
        );
      }

      // update queue if queue exist and refund is valid
      const queueWithUpdatedStatus = await this.prisma.ethereumQueue.update({
        where: { transactionHash },
        data: { status: QueueStatus.REFUND_REQUESTED },
      });

      return {
        ...queueWithUpdatedStatus,
        id: String(queueWithUpdatedStatus.id),
      };
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.status ?? (e.code || HttpStatus.INTERNAL_SERVER_ERROR),
          error: `API call for refund was unsuccessful: ${e.message}`,
        },
        e.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}
