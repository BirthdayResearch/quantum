import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { PaginationQuery } from '../../../pagination/ApiQuery';
import { EthereumOrderStatusPipe } from '../../../pipes/EthereumOrderStatus.pipe';
import { EthereumTransactionValidationPipe } from '../../../pipes/EthereumTransactionValidation.pipe';
import { QueueService } from '../services/QueueService';

@Controller()
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get(':transactionHash')
  async getQueue(
    @Param('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string,
    @Query('status', new EthereumOrderStatusPipe(OrderStatus))
    status?: OrderStatus,
  ) {
    return this.queueService.getQueue(transactionHash, status);
  }

  @Get('list')
  async listQueue(
    @Query('status', new EthereumOrderStatusPipe(OrderStatus)) status: OrderStatus,
    @Query() query?: PaginationQuery,
  ) {
    return this.queueService.listQueue(query, status);
  }
}
