import { Controller, Get, Param, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { PathIndex } from '@prisma/client';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { WhaleWalletService } from '../services/WhaleWalletService';

@Controller('/wallet')
export class WhaleWalletController {
  private network: EnvironmentNetwork;

  constructor(private readonly whaleWalletService: WhaleWalletService, private readonly configService: ConfigService) {
    this.network = configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
  }

  @Throttle(5, 60)
  @Get('address/generate')
  async get(@Query() query: { refundAddress: string }): Promise<Omit<PathIndex, 'id' | 'index'>> {
    return this.whaleWalletService.generateAddress(query.refundAddress, this.network);
  }

  @Get('address/:address')
  async getAddressDetailById(@Param() params: { address: string }): Promise<Omit<PathIndex, 'id' | 'index'>> {
    return this.whaleWalletService.getAddressDetails(params.address);
  }
}
