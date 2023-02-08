import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';

import { NetworkContainer } from '../NetworkContainer';
import { WhaleWalletService } from '../services/WhaleWalletService';

@Controller('/wallet')
export class WhaleWalletController extends NetworkContainer {
  constructor(private readonly whaleWalletService: WhaleWalletService, private readonly configService: ConfigService) {
    super(configService);
  }

  @Throttle(5, 60)
  @Get('generate-address')
  async get(): Promise<string> {
    return this.whaleWalletService.generateAddress();
  }
}
