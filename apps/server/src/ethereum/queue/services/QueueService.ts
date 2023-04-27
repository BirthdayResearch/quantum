import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

import { ApiPagedResponse } from '../../../pagination/ApiPagedResponse';
import { PaginationQuery } from '../../../pagination/ApiQuery';
import { PrismaService } from '../../../PrismaService';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  async getOrder(transactionHash: string, status?: OrderStatus) {
    try {
      const order = await this.prisma.ethereumOrders.findFirst({
        where: {
          transactionHash,
          status: status || undefined,
        },
        select: {
          id: true,
          transactionHash: true,
          ethereumStatus: true,
          status: true,
          updatedAt: true,
          amount: true,
          tokenSymbol: true,
          defichainAddress: true,
          expiryDate: true,
          adminOrder: {
            select: {
              sendTransactionHash: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
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

  async listOrder(
    query: PaginationQuery = {
      size: 30,
    },
    status?: OrderStatus,
  ) {
    try {
      const next = query.next !== undefined ? BigInt(query.next) : undefined;
      const size = Math.min(query.size ?? 12);

      const orderList = await this.prisma.ethereumOrders.findMany({
        where: status ? { status } : undefined,
        cursor: next ? { id: next } : undefined,
        take: size + 1,
        orderBy: {
          id: Prisma.SortOrder.asc,
        },
      });

      if (!orderList) {
        throw new Error('No orders found');
      }

      const stringifiedOrderList = orderList.map((order) => ({
        ...order,
        id: order.id.toString(),
      }));

      return ApiPagedResponse.of(stringifiedOrderList, size, (order) => order.id);
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `API call to list order was unsuccessful: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}
