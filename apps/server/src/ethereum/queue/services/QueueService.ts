import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, QueueStatus } from '@prisma/client';

import { ApiPagedResponse } from '../../../pagination/ApiPagedResponse';
import { PaginationQuery } from '../../../pagination/ApiQuery';
import { PrismaService } from '../../../PrismaService';
import { OrderBy, Queue } from '../model/Queue';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  async getQueue(transactionHash: string, status?: QueueStatus): Promise<Queue> {
    try {
      const queue = await this.prisma.ethereumQueue.findFirst({
        where: {
          transactionHash,
          status: status || undefined,
        },
        select: {
          id: true,
          transactionHash: true,
          ethereumStatus: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          amount: true,
          tokenSymbol: true,
          defichainAddress: true,
          expiryDate: true,
          adminQueue: {
            select: {
              sendTransactionHash: true,
            },
          },
        },
      });

      if (!queue) {
        throw new Error('Queue not found');
      }

      return {
        ...queue,
        id: String(queue.id),
      };
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `API call to get queue was unsuccessful: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }

  async listQueue(
    query: PaginationQuery = {
      size: 30,
    },
    orderBy?: OrderBy,
    status?: QueueStatus[],
  ): Promise<ApiPagedResponse<Queue>> {
    try {
      const next = query.next !== undefined ? BigInt(query.next) : undefined;
      const size = Math.min(query.size ?? 10);
      let orderById;

      switch (orderBy) {
        case OrderBy.DESC:
          orderById = Prisma.SortOrder.desc;
          break;
        case OrderBy.ASC:
        default:
          orderById = Prisma.SortOrder.asc;
          break;
      }

      const [queueCount, queueList] = await this.prisma.$transaction([
        this.prisma.ethereumQueue.count({
          where: {
            status: {
              in: status,
            },
          },
        }),
        this.prisma.ethereumQueue.findMany({
          where: {
            status: {
              in: status,
            },
          },
          cursor: next ? { id: next } : undefined,
          take: size + 1, // to get extra 1 to check for next page
          orderBy: {
            id: orderById,
          },
          select: {
            id: true,
            transactionHash: true,
            ethereumStatus: true,
            status: true,
            updatedAt: true,
            createdAt: true,
            amount: true,
            tokenSymbol: true,
            defichainAddress: true,
            expiryDate: true,
            adminQueue: {
              select: {
                sendTransactionHash: true,
              },
            },
          },
        }),
      ]);

      const totalPage = Math.ceil(queueCount / size);

      // Fetch the final page
      const finalPage = await this.prisma.ethereumQueue.findMany({
        where: {
          status: {
            in: status,
          },
        },
        take: size,
        skip: (totalPage - 1) * size,
        orderBy: {
          id: orderById,
        },
      });

      // get first item of the final page and extract the id
      const firstItem = finalPage[0];
      const firstItemId = firstItem ? firstItem.id.toString() : undefined;

      const totalPageObj =
        firstItemId !== undefined ? { totalPage: totalPage.toString(), lastPageCursor: firstItemId } : undefined;

      if (!queueList || queueList.length === 0) {
        throw new Error('No queues found');
      }

      const stringifiedQueueList = queueList.map((queue) => ({
        ...queue,
        id: queue.id.toString(),
      }));

      return ApiPagedResponse.of(stringifiedQueueList, size, (queue) => queue.id, totalPageObj);
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `API call to list queue was unsuccessful: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}
