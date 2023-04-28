import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma,QueueStatus } from '@prisma/client';

import { ApiPagedResponse } from '../../../pagination/ApiPagedResponse';
import { PaginationQuery } from '../../../pagination/ApiQuery';
import { PrismaService } from '../../../PrismaService';
import { Queue } from '../model/Queue';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  async getQueue(transactionHash: string, status?: QueueStatus) {
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
    status?: QueueStatus,
  ): Promise<ApiPagedResponse<Queue>> {
    try {
      const next = query.next !== undefined ? BigInt(query.next) : undefined;
      const size = Math.min(query.size ?? 10);

      const queueList = await this.prisma.ethereumQueue.findMany({
        where: status ? { status } : undefined,
        cursor: next ? { id: next } : undefined,
        take: size + 1, // to get extra 1 to check for next page
        orderBy: {
          id: Prisma.SortOrder.asc,
        },
      });

      if (!queueList || queueList.length === 0) {
        throw new Error('No queues found');
      }

      const stringifiedQueueList = queueList.map((queue) => ({
        ...queue,
        id: queue.id.toString(),
      }));

      return ApiPagedResponse.of(stringifiedQueueList, size, (queue) => queue.id);
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
