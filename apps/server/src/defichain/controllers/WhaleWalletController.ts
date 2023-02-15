import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { DeFiChainAddressIndex } from '@prisma/client';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import BigNumber from 'bignumber.js';
import { CustomErrorCodes } from 'src/CustomErrorCodes';

import { ThrottleLimitConfig } from '../../ThrottleLimitConfig';
import { VerifyDto, VerifyObject } from '../model/VerifyDto';
import { WhaleWalletService } from '../services/WhaleWalletService';

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
  async verify(@Body() body: VerifyDto): Promise<{ isValid: boolean; statusCode?: CustomErrorCodes }> {
    return this.whaleWalletService.verify(
      new VerifyObject(new BigNumber(body.amount), body.address, body.symbol),
      this.network,
    );
  }
}
