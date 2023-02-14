import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import { EthereumTransactionValidationPipe } from '../../pipes/EthereumTransactionValidation.pipe';
import { HandledEVMTransaction } from '../../types/HandledEVMTransaction';
import { EVMTransactionConfirmerService } from '../services/EVMTransactionConfirmerService';

@Controller()
export class EthereumController {
  constructor(private readonly evmTransactionConfirmerService: EVMTransactionConfirmerService) {}

  @Post('handleTransaction')
  @UseGuards(ThrottlerGuard)
  async handleTransaction(
    @Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string,
  ): Promise<HandledEVMTransaction> {
    return this.evmTransactionConfirmerService.handleTransaction(transactionHash);
  }
}
