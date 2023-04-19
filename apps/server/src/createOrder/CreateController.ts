import { Body, Controller, Post, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EthereumTransactionValidationPipe } from 'src/pipes/EthereumTransactionValidation.pipe';

import { CreateService } from './CreateService';

@Controller()
export class CreateController {
  constructor(private readonly createService: CreateService) {}

  @Post('order')
  @Throttle(35, 60)
  order(@Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.createService.createOrder(transactionHash);
  }

  @Put('verify')
  @Throttle(35, 60)
  verify(@Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.createService.verify(transactionHash);
  }
}
