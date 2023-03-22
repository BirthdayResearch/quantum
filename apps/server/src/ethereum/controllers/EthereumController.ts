import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { SupportedEVMTokenSymbols } from '../../AppConfig';
import { SemaphoreCache } from '../../libs/caches/SemaphoreCache';
import { EthereumTransactionValidationPipe } from '../../pipes/EthereumTransactionValidation.pipe';
import { StatsDto, StatsQueryDto } from '../EthereumInterface';
import { EVMTransactionConfirmerService, HandledEVMTransaction } from '../services/EVMTransactionConfirmerService';

@Controller()
export class EthereumController {
  constructor(
    private readonly evmTransactionConfirmerService: EVMTransactionConfirmerService,
    protected readonly cache: SemaphoreCache,
  ) {}

  @Get('balance/:tokenSymbol')
  async getBalance(@Param('tokenSymbol') tokenSymbol: SupportedEVMTokenSymbols): Promise<string> {
    return this.evmTransactionConfirmerService.getBalance(tokenSymbol);
  }

  @Get('stats/')
  async getStats(@Query('date') date?: StatsQueryDto): Promise<StatsDto | undefined> {
    return this.cache.get(
      `ETH_STATS_${date ?? 'TODAY'}`,
      async () => {
        try {
          return await this.evmTransactionConfirmerService.getStats(date);
        } catch (e: any) {
          throw new HttpException(
            {
              status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
              error: `API call for Ethereum statistics was unsuccessful: ${e.message}`,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
            {
              cause: e,
            },
          );
        }
      },
      {
        ttl: 3600_000 * 24, // 1 day
      },
    );
  }

  @Post('handleTransaction')
  @Throttle(35, 60)
  async handleTransaction(
    @Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string,
  ): Promise<HandledEVMTransaction> {
    return this.evmTransactionConfirmerService.handleTransaction(transactionHash);
  }

  @Post('allocateDFCFund')
  @UseGuards(ThrottlerGuard)
  async allocateDFCFund(
    @Body('transactionHash', new EthereumTransactionValidationPipe()) transactionHash: string,
  ): Promise<any> {
    return this.evmTransactionConfirmerService.allocateDFCFund(transactionHash);
  }
}
