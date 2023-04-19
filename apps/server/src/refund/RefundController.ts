import { Controller, Post, Query } from '@nestjs/common';

import { RequestRefundOrderDto } from './RefundInterface';
import { RefundService } from './RefundService';

@Controller()
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post('/requestRefundOrder')
  async requestRefundOrder(@Query() transactionHash: RequestRefundOrderDto) {
    return this.refundService.requestRefundOrder(transactionHash);
  }
}
