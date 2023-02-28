import { stats } from '@defichain/whale-api-client';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { WhaleApiService } from '../services/WhaleApiService';

@Controller('/stats')
export class StatsController {
  private network: EnvironmentNetwork;

  constructor(private readonly whaleClient: WhaleApiService, private readonly configService: ConfigService) {
    this.network = configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
  }

  @SkipThrottle()
  @Get()
  async get(): Promise<stats.StatsData> {
    return this.whaleClient.getClient().stats.get();
  }
}
