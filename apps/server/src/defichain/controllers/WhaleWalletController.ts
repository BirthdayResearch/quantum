import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { WhaleWalletService } from '../services/WhaleWalletService';

@Controller('/wallet')
export class WhaleWalletController {
  private network: EnvironmentNetwork;

  constructor(private readonly whaleWalletService: WhaleWalletService, private readonly configService: ConfigService) {
    this.network = configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
  }

  @Throttle(5, 60)
  @Get('generate-address')
  async get(): Promise<string> {
    return this.whaleWalletService.generateAddress();
  }
}
