import { Body, Controller, Post, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { EthereumTransactionValidationPipe } from '../pipes/EthereumTransactionValidation.pipe';
import { QueueService } from './QueueService';

@Controller()
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  @Throttle(35, 60)
  queue(@Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.queueService.createQueueTransaction(transactionHash);
  }

  @Put('verify')
  @Throttle(35, 60)
  verify(@Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.queueService.verify(transactionHash);
  }
}
