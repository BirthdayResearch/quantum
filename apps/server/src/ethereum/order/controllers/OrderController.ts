import { Controller, Get, Param, Query } from '@nestjs/common';

import { OrderService } from '../services/OrderService';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('/ethereum/order/:transactionHash')
  async getOrder(@Param('transactionHash') transactionHash: string, @Query('status') status: string) {
    return this.orderService.getOrder(transactionHash, status);
  }
}
