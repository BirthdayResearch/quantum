import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { QueueService } from '../services/QueueService';

@Controller('defichain/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * Verify a queue transaction with given transactionHash and update the defichainStatus.
   *
   * @Body {string} transactionHash transactionHash
   * @returns {Promise<VerifyQueueTransactionDto>}
   */
  @Post('verify')
  @Throttle(35, 60)
  verify(@Body('transactionHash') transactionHash: string) {
    return this.queueService.verify(transactionHash);
  }
}
