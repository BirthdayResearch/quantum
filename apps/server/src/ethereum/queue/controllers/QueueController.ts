import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { PaginationQuery } from '../../../pagination/api.query';
import { EthereumOrderStatusPipe } from '../../../pipes/EthereumOrderStatus.pipe';
import { EthereumTransactionValidationPipe } from '../../../pipes/EthereumTransactionValidation.pipe';
import { QueueService } from '../services/QueueService';

@Controller()
export class QueueController {
  constructor(private readonly orderService: QueueService) {}

  @Get(':transactionHash')
  async getOrder(
    @Param('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string,
    @Query('status', new EthereumOrderStatusPipe(OrderStatus))
    status?: OrderStatus,
  ) {
    return this.orderService.getOrder(transactionHash, status);
  }

  @Get('list')
  async listOrder(
    @Query('status', new EthereumOrderStatusPipe(OrderStatus)) status: OrderStatus,
    @Query() query?: PaginationQuery,
  ) {
    return this.orderService.listOrder(query, status);
  }
}
