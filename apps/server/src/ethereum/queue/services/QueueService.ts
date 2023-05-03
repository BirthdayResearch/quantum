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
          status,
        },
        include: {
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
      size: 10,
    },
    orderBy?: OrderBy,
    status?: QueueStatus[],
  ): Promise<ApiPagedResponse<Queue>> {
    try {
      const next = query.next !== undefined ? BigInt(query.next) : undefined;
      const size = Number(query.size);

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
          include: {
            adminQueue: {
              select: {
                sendTransactionHash: true,
              },
            },
          },
        }),
      ]);

      if (!queueList || queueList.length === 0) {
        return ApiPagedResponse.of([], size);
      }

      const stringifiedQueueList = queueList.map((queue) => ({
        ...queue,
        id: queue.id.toString(),
      }));

      return ApiPagedResponse.of(stringifiedQueueList, size, (queue) => queue.id, queueCount.toString());
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
