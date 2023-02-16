import { Body, Controller, Get, Param, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { DeFiChainAddressIndex } from '@prisma/client';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { ThrottleLimitConfig } from '../../ThrottleLimitConfig';
import { VerifyDto } from '../model/VerifyDto';
import { VerifyResponse, WhaleWalletService } from '../services/WhaleWalletService';

@Controller('/wallet')
export class WhaleWalletController {
  private network: EnvironmentNetwork;

  constructor(private readonly whaleWalletService: WhaleWalletService, private readonly configService: ConfigService) {
    this.network = configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
  }

  @Throttle(5, 60)
  @Get('address/generate')
  async get(@Query() query: { refundAddress: string }): Promise<Omit<DeFiChainAddressIndex, 'id' | 'index'>> {
    return this.whaleWalletService.generateAddress(query.refundAddress, this.network);
  }

  @Get('address/:address')
  async getAddressDetailById(
    @Param() params: { address: string },
  ): Promise<Omit<DeFiChainAddressIndex, 'id' | 'index'>> {
    return this.whaleWalletService.getAddressDetails(params.address);
  }

  @Throttle(ThrottleLimitConfig.limit, ThrottleLimitConfig.ttl)
  @Post('verify')
  @UsePipes(new ValidationPipe({ transform: true }))
  async verify(@Body() body: VerifyDto): Promise<VerifyResponse> {
    return this.whaleWalletService.verify(body.toObj(), this.network);
  }
}
