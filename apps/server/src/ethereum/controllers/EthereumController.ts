import { Body, Controller, Post } from '@nestjs/common';

import { EthereumTransactionValidationPipe } from '../../pipes/EthereumTransactionValidation.pipe';
import { EVMTransactionConfirmerService } from '../services/EVMTransactionConfirmerService';

@Controller()
export class EthereumController {
  constructor(private readonly evmTransactionConfirmerService: EVMTransactionConfirmerService) {}

  @Post('handleTransaction')
  async handleTransaction(
    @Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string,
  ): Promise<boolean> {
    return this.evmTransactionConfirmerService.handleTransaction(transactionHash);
  }
}
