import { Controller, Post, Query } from '@nestjs/common';
import { EthereumOrderTable } from '@prisma/client';

import { EthereumOrderBookService } from './EthereumOrderBookService';

@Controller()
export class EthereumOrderBookController {
  constructor(private readonly orderService: EthereumOrderBookService) {}

  @Post('/ethereum/orderbook')
  async getOrderBook(@Query() order: EthereumOrderTable) {
    return this.orderService.insertOrderBook(order);
  }
}
