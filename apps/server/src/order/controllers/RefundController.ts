import { Controller, Param, Put } from '@nestjs/common';

import { RefundService } from '../services/RefundService';

@Controller()
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Put(':transactionHash/refund')
  async requestRefundOrder(@Param('transactionHash') transactionHash: string) {
    return this.refundService.requestRefundOrder(transactionHash);
  }
}
