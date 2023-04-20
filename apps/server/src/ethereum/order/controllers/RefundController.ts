import { Controller, Param, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { EthereumTransactionValidationPipe } from '../../../pipes/EthereumTransactionValidation.pipe';
import { RefundService } from '../services/RefundService';

@Controller()
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Throttle(35, 60)
  @Put(':transactionHash/refund')
  async requestRefundOrder(@Param('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.refundService.requestRefundOrder(transactionHash);
  }
}
