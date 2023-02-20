import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import { SupportedTokenSymbols } from '../../AppConfig';
import { EthereumTransactionValidationPipe } from '../../pipes/EthereumTransactionValidation.pipe';
import { EVMTransactionConfirmerService, HandledEVMTransaction } from '../services/EVMTransactionConfirmerService';

@Controller()
export class EthereumController {
  constructor(private readonly evmTransactionConfirmerService: EVMTransactionConfirmerService) {}

  @Get('balance/:tokenSymbol')
  async getBalance(@Param('tokenSymbol') tokenSymbol: SupportedTokenSymbols): Promise<string> {
    return this.evmTransactionConfirmerService.getBalance(tokenSymbol);
  }

  @Post('handleTransaction')
  @UseGuards(ThrottlerGuard)
  async handleTransaction(
    @Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string,
  ): Promise<HandledEVMTransaction> {
    return this.evmTransactionConfirmerService.handleTransaction(transactionHash);
  }
}
