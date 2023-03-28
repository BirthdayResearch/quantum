import { Controller, Get, Query } from '@nestjs/common';

import { SemaphoreCache } from '../../libs/caches/SemaphoreCache';
import { TransactionsDto, TransactionsQueryDto } from '../EthereumInterface';
import { EthereumTransactionsService } from '../services/EthereumTransactionsService';

@Controller()
export class TransactionsController {
  constructor(
    private readonly ethereumTransactionsService: EthereumTransactionsService,
    protected readonly cache: SemaphoreCache,
  ) {}

  @Get('transactions')
  async getTransactions(
    @Query('fromDate') fromDate: TransactionsQueryDto['fromDate'],
    @Query('toDate') toDate: TransactionsQueryDto['toDate'],
  ): Promise<TransactionsDto[] | undefined> {
    const cacheKey = `ETH_TX_${fromDate}_${toDate}`;
    return this.cache.get(cacheKey, async () => this.ethereumTransactionsService.getTransactions(fromDate, toDate), {
      ttl: 3600_000 * 24, // 1 day
    });
  }
}
