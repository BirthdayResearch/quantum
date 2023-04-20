import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../PrismaService';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async getOrder(transactionHash: string, status?: string) {
    try {
      // return await this.prisma.ethereumOrderTable.findUnique({
      //   where: {
      //     transactionHash: transactionHash,
      //     status: {status} ?? undefined,
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

  // async listOrder(
  //   query: PaginationQuery = {
  //     size: 30,
  //   },
  //   status?: string,
  // ) {
  //   try {
  //     const next = query.next !== undefined ? String(query.next) : undefined;
  //     const size = query.size;
  //
  //     const orderList = await this.prisma.ethereumOrderTable.findMany({
  //       where: status ? { status } : undefined,
  //       cursor: next ? { id: next } : undefined,
  //       take: size,
  //       orderBy: {
  //         id: Prisma.SortOrder.asc,
  //       },
  //     });
  //
  //     return ApiPagedResponse.of(orderList, size, (order) => {
  //       return order.id;
  //     });
  //   } catch (e: any) {
  //     throw new HttpException(
  //       {
  //         status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
  //         error: `API call to list order was unsuccessful: ${e.message}`,
  //       },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //       {
  //         cause: e,
  //       },
  //     );
  //   }
  // }
}
