import { Body, Controller, Post, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EthereumTransactionValidationPipe } from 'src/pipes/EthereumTransactionValidation.pipe';

import { OrderService } from './OrderService';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('order')
  @Throttle(35, 60)
  order(@Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.orderService.createOrder(transactionHash);
  }

  @Put('verify')
  @Throttle(35, 60)
  verify(@Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.orderService.verify(transactionHash);
  }
}
