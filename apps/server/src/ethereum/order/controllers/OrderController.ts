import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { EthereumOrderStatusPipe } from '../../../pipes/EthereumOrderStatus.pipe';
import { EthereumTransactionValidationPipe } from '../../../pipes/EthereumTransactionValidation.pipe';
import { OrderService } from '../services/OrderService';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get(':transactionHash')
  async getOrder(
    @Param('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string,
    @Query('status', new EthereumOrderStatusPipe(OrderStatus))
    status?: OrderStatus,
  ) {
    return this.orderService.getOrder(transactionHash, status);
  }

  // @Get('list')
  // async listOrder(@Query('status') status: string, @Query() query?: PaginationQuery) {}
}
