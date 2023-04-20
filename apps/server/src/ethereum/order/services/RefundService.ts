import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

import { ETHERS_RPC_PROVIDER } from '../../../modules/EthersModule';
import { PrismaService } from '../../../PrismaService';
import { EVMTransactionConfirmerService } from '../../services/EVMTransactionConfirmerService';

@Injectable()
export class RefundService {
  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private evmTransactionConfirmerService: EVMTransactionConfirmerService,
    private prisma: PrismaService,
  ) {}

  async requestRefundOrder(transactionHash: string) {
    try {
      const isValidTxn = await this.evmTransactionConfirmerService.verifyIfValidTxn(transactionHash);

      if (!isValidTxn) {
        throw new Error('Invalid Transaction Hash');
      }

      const order = await this.prisma.ethereumOrders.update({
        where: { transactionHash },
        data: { status: 'REFUND_REQUESTED' },
      });
      return {
        ...order,
        id: String(order.id),
      };
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `API call for refund was unsuccessful: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}
