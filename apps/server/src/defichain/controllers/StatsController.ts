import { stats } from '@defichain/whale-api-client';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NetworkContainer } from '../NetworkContainer';
import { WhaleApiService } from '../services/WhaleApiService';

@Controller('/stats')
export class StatsController extends NetworkContainer {
  constructor(private readonly whaleClient: WhaleApiService, private readonly configService: ConfigService) {
    super(configService);
  }

  @Get()
  async get(): Promise<stats.StatsData> {
    return this.whaleClient.getClient().stats.get();
  }
}
