import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { PrismaService } from '../../../PrismaService';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async getOrder(transactionHash: string, status?: OrderStatus) {
    try {
      const order = await this.prisma.ethereumOrders.findFirst({
        where: {
          transactionHash,
          status: status || undefined,
        },
      });

      if (!order) {
        return null;
      }

      return {
        ...order,
        id: String(order.id),
      };
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
