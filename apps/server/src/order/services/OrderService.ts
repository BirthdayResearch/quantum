import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../PrismaService';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async getOrder(transactionHash: string, status?: string) {
    try {
      // return await this.prisma.ethereumOrderTable.findUnique({
      //   where: {
      //     transactionHash: transactionHash,
      //     status: status ?? undefined,
      //   },
      // });
      return `${transactionHash} and ${status}`;
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `API call to get order was unsuccessful: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}
