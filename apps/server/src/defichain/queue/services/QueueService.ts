import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeFiChainTransactionStatus } from '@prisma/client';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { PrismaService } from '../../../PrismaService';
import { DeFiChainTransactionService } from '../../services/DeFiChainTransactionService';
import { VerifyQueueTransactionDto } from '../model/Queue';

@Injectable()
export class DfcQueueService {
  private network: EnvironmentNetwork;

  private readonly MIN_REQUIRED_DFC_CONFIRMATION = 65;

  constructor(
    private configService: ConfigService,
    private readonly deFiChainTransactionService: DeFiChainTransactionService,
    private prisma: PrismaService,
  ) {
    this.network = this.configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
  }

  async verify(transactionHash: string): Promise<VerifyQueueTransactionDto> {
    try {
      const { numberOfConfirmations } = await this.deFiChainTransactionService.getTxn(transactionHash);

      if (numberOfConfirmations < this.MIN_REQUIRED_DFC_CONFIRMATION) {
        return { numberOfConfirmations, isConfirmed: false };
      }

      const adminQueueTxnExist = await this.prisma.adminEthereumQueue.findFirst({
        where: {
          sendTransactionHash: transactionHash,
        },
      });

      if (!adminQueueTxnExist) {
        throw new Error('Transaction Hash does not exists in admin table');
      }

      await this.prisma.adminEthereumQueue.update({
        where: { sendTransactionHash: transactionHash },
        data: { defichainStatus: DeFiChainTransactionStatus.CONFIRMED },
      });

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
