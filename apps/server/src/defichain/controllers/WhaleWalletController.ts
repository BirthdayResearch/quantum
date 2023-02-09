import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { CustomErrorCodes } from 'src/CustomErrorCodes';

import { ThrottleLimitConfig } from '../../ThrottleLimitConfig';
import { VerifyDto } from '../model/VerifyDto';
import { WhaleWalletService } from '../services/WhaleWalletService';

@Throttle(ThrottleLimitConfig.limit, ThrottleLimitConfig.ttl)
@Controller('/wallet')
export class WhaleWalletController {
  private network: EnvironmentNetwork;

  constructor(private readonly whaleWalletService: WhaleWalletService, private readonly configService: ConfigService) {
    this.network = this.configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
  }

  @Get('generate-address')
  async get(): Promise<{ address: string }> {
    return this.whaleWalletService.generateAddress();
  }

  @Post('verify')
  async verify(@Body() body: VerifyDto): Promise<{ isValid: boolean; statusCode?: CustomErrorCodes }> {
    return this.whaleWalletService.verify(body, this.network);
  }
}
