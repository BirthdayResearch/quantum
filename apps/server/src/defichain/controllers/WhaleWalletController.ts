import { Controller, Get, Param,Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Network } from '@prisma/client';

import { NetworkDto } from '../model/NetworkDto';
import { WhaleWalletService } from '../services/WhaleWalletService';

@Controller('/wallet')
export class WhaleWalletController {
  constructor(private readonly whaleWalletService: WhaleWalletService) {}

  @Throttle(5, 60)
  @Get('address/generate')
  async get(@Query() query: NetworkDto & { refundAddress: string }): Promise<{ address: string }> {
    return this.whaleWalletService.generateAddress(query.refundAddress, query.network);
  }

  @Get('address/:address')
  async getAddressDetailById(
    @Query() query: NetworkDto,
    @Param() params: { address: string },
  ): Promise<{ address: string; network: Network; refundAddress: string; createdAt: Date } | null> {
    return this.whaleWalletService.getAddressDetails(params.address, query.network);
  }
}
