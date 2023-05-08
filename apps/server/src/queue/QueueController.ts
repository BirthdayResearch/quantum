import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { EthereumTransactionValidationPipe } from '../pipes/EthereumTransactionValidation.pipe';
import { QueueService } from './QueueService';

@Controller()
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('/defichain/queue/verify')
  @Throttle(35, 60)
  defichainQueueVerify(@Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.queueService.defichainQueueVerify(transactionHash);
  }
}
