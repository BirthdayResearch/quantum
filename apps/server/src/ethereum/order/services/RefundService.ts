import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../PrismaService';

@Injectable()
export class RefundService {
  constructor(private prisma: PrismaService) {}

  async requestRefundOrder(transactionHash: string) {
    try {
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
