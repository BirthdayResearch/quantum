import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../PrismaService';
import { RequestRefundOrderDto } from './RefundInterface';

@Injectable()
export class RefundService {
  constructor(private prisma: PrismaService) {}

  async requestRefundOrder(orderDto: RequestRefundOrderDto) {
    try {
      await this.prisma.ethereumOrderTable.update({
        where: { transactionHash: orderDto.transactionHash },
        data: { status: 'REFUND_REQUESTED' },
      });
      return `Refund_Requested for ${orderDto.transactionHash}`;
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `API call for requestRefundOrder was unsuccessful: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}
