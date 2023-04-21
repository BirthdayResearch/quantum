import { Controller, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { EthereumTransactionValidationPipe } from '../../../pipes/EthereumTransactionValidation.pipe';
import { RefundService } from '../services/RefundService';

@Controller()
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  /**
   * Return order with status updated as OrderStatus.REFUND_REQUESTED
   *
   * @param {transactionHash} transactionHash unique transaction hash that is created when a transaction is done from EVM -> DFC
   */
  @Throttle(35, 60)
  @Post(':transactionHash/refund')
  async requestRefundOrder(@Param('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string) {
    return this.refundService.requestRefundOrder(transactionHash);
  }
}
