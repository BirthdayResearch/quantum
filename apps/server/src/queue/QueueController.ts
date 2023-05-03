import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { EthereumTransactionValidationPipe } from '../pipes/EthereumTransactionValidation.pipe';
import { QueueService } from './QueueService';

@Controller()
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  @Throttle(5, 60)
  queue(@Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.queueService.createQueueTransaction(transactionHash);
  }

  @Post('verify')
  @Throttle(35, 60)
  verify(@Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.queueService.verify(transactionHash);
  }
}
