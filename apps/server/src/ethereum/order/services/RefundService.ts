import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import { ETHERS_RPC_PROVIDER } from '../../../modules/EthersModule';
import { PrismaService } from '../../../PrismaService';
import { EVMTransactionConfirmerService } from '../../services/EVMTransactionConfirmerService';

@Injectable()
export class RefundService {
  private readonly contractAddress: string;

  private readonly MIN_REQUIRED_EVM_CONFIRMATION = 65;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private evmTransactionConfirmerService: EVMTransactionConfirmerService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.contractAddress = this.configService.getOrThrow('ethereum.contracts.bridgeProxy.address');
  }

  async requestRefundOrder(transactionHash: string) {
    try {
      const isValidTxn = await this.evmTransactionConfirmerService.verifyIfValidTxn(transactionHash);
      const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);
      const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
      const numberOfConfirmations = BigNumber.max(currentBlockNumber - txReceipt.blockNumber, 0).toNumber();

      if (!isValidTxn || txReceipt.to !== this.contractAddress) {
        throw new Error('Invalid Transaction Hash');
      }

      const order = await this.prisma.ethereumOrders.findFirst({
        where: {
          transactionHash,
        },
      });

      // if order does not exist throw 'Order not found'
      if (!order) {
        throw new Error('Order not found');
      }

      // check for 65 confirmations in evm
      if (numberOfConfirmations < this.MIN_REQUIRED_EVM_CONFIRMATION) {
        throw new Error(
          'Transaction has not been processed, did not complete 65 confirmations for EVM unable to proceed with refund request',
        );
      }

      // if order status is `Draft`, `Completed` or `Refunded throw Invalid Refund
      if (
        order.status === OrderStatus.REFUNDED ||
        order.status === OrderStatus.DRAFT ||
        order.status === OrderStatus.COMPLETED
      ) {
        throw new Error('Order cannot be refunded');
      }

      // update order if order exist and refund is valid
      const updateOrder = await this.prisma.ethereumOrders.update({
        where: { transactionHash },
        data: { status: OrderStatus.REFUND_REQUESTED },
      });

      return {
        ...updateOrder,
        id: String(updateOrder.id),
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
