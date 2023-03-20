import { stats } from '@defichain/whale-api-client';
import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { SemaphoreCache } from '../../libs/caches/SemaphoreCache';
import { DeFiChainStats, DFCStatsDto } from '../DefichainInterface';
import { DeFiChainStatsService } from '../services/DeFiChainStatsService';
import { WhaleApiService } from '../services/WhaleApiService';

@Controller()
export class StatsController {
  private network: EnvironmentNetwork;

  constructor(
    private readonly whaleClient: WhaleApiService,
    private readonly configService: ConfigService,
    protected readonly cache: SemaphoreCache,
    private defichainStatsService: DeFiChainStatsService,
  ) {
    this.network = configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
  }

  @SkipThrottle()
  @Get('/whale/stats')
  async get(): Promise<stats.StatsData> {
    return this.whaleClient.getClient().stats.get();
  }

  @Get('/stats')
  async getDFCStats(@Query('date') date?: DFCStatsDto): Promise<DeFiChainStats | undefined> {
    return this.cache.get(
      `DFC_STATS_${date ?? 'TODAY'}`,
      async () => {
        try {
          const { totalTransactions, confirmedTransactions, amountBridged } =
            await this.defichainStatsService.getDefiChainStats(date);
          return new DeFiChainStats(totalTransactions, confirmedTransactions, amountBridged);
        } catch (e: any) {
          throw new HttpException(
            {
              status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
              error: `API call for DefiChain statistics was unsuccessful: ${e.message}`,
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
}
