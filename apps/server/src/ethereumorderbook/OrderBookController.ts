import { Controller, Post, Query } from '@nestjs/common';
import { EthereumOrderTable } from '@prisma/client';

import { OrderBookService } from './OrderBookService';

@Controller()
export class OrderBookController {
  constructor(private readonly orderService: OrderBookService) {}

  @Post('/orderbook')
  async getOrderBook(@Query() order: EthereumOrderTable) {
    return this.orderService.insertOrderBook(order);
  }
}
