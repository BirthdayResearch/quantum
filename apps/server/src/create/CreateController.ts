import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EthereumTransactionValidationPipe } from 'src/pipes/EthereumTransactionValidation.pipe';

import { CreateService } from './CreateService';

@Controller()
export class CreateController {
  constructor(private readonly createService: CreateService) {}

  @Post('createOrder')
  @Throttle(35, 60)
  createOrder(@Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.createService.createOrder(transactionHash);
  }
}
