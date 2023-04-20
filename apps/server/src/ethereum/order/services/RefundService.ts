import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { BridgeV1__factory } from 'smartcontracts';

import { ETHERS_RPC_PROVIDER } from '../../../modules/EthersModule';
import { PrismaService } from '../../../PrismaService';

@Injectable()
export class RefundService {
  constructor(
    private prisma: PrismaService,
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
  ) {}

  async requestRefundOrder(transactionHash: string) {
    try {
      const isValidTxn = await this.verifyIfValidTxn(transactionHash);

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

  private async verifyIfValidTxn(transactionHash: string): Promise<boolean> {
    const { parsedTxnData } = await this.parseTxnHash(transactionHash);
    // Sanity check that the decoded function name and signature are correct
    if (
      parsedTxnData.name !== 'bridgeToDeFiChain' ||
      parsedTxnData.signature !== 'bridgeToDeFiChain(bytes,address,uint256)'
    ) {
      return false;
    }

    // TODO: update parsedTxnData.name and parsedTxnData.signature to reflect latest SC

    return true;
  }

  private async parseTxnHash(transactionHash: string): Promise<{
    etherInterface: ethers.utils.Interface;
    parsedTxnData: ethers.utils.TransactionDescription;
  }> {
    // TODO: update BridgeV1__factory to reflect latest SC

    const onChainTxnDetail = await this.ethersRpcProvider.getTransaction(transactionHash);
    const etherInterface = new ethers.utils.Interface(BridgeV1__factory.abi);
    const parsedTxnData = etherInterface.parseTransaction({
      data: onChainTxnDetail.data,
      value: onChainTxnDetail.value,
    });

    return { etherInterface, parsedTxnData };
  }
}
