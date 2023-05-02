import { Controller, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { QueueStatus } from '@prisma/client';

import { ApiPagedResponse } from '../../../pagination/ApiPagedResponse';
import { PaginationQuery } from '../../../pagination/ApiQuery';
import { EthereumQueueStatusPipe } from '../../../pipes/EthereumQueueStatus.pipe';
import { EthereumTransactionValidationPipe } from '../../../pipes/EthereumTransactionValidation.pipe';
import { Queue } from '../model/Queue';
import { QueueService } from '../services/QueueService';

@Controller()
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * Get information about a queue with given transactionHash.
   *
   * @param {string} transactionHash transactionHash
   * @param {QueueStatus} [status=QueueStatus] status of queue
   * @returns {Promise<Queue>}
   */
  @Get(':transactionHash')
  async getQueue(
    @Param('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string,
    @Query('status', new EthereumQueueStatusPipe(QueueStatus))
    status?: QueueStatus,
  ): Promise<Queue> {
    return this.queueService.getQueue(transactionHash, status);
  }

  /**
   * Return paginated queue list.
   *
   * @param {QueueStatus} [status=QueueStatus] status of queue
   * @param {PaginationQuery} query pagination query
   * @returns {Promise<ApiPagedResponse<Queue>>}
   */
  @Get('list')
  @Throttle(20, 60)
  async listQueue(
    @Query('status', new EthereumQueueStatusPipe(QueueStatus)) status: QueueStatus,
    @Query() query?: PaginationQuery,
  ): Promise<ApiPagedResponse<Queue>> {
    return this.queueService.listQueue(query, status);
  }
}
