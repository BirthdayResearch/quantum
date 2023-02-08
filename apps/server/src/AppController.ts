import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BigNumber } from 'ethers';

import { AppService } from './AppService';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('blockheight')
  async getBlockHeight(): Promise<number> {
    return this.appService.getBlockHeight();
  }

  @Get('balance')
  async getBalance(@Query('address') address: string): Promise<BigNumber> {
    return this.appService.getBalance(address);
  }

  @Post('handleTransaction')
  async handleTransaction(@Body('transactionHash') transactionHash: string): Promise<boolean> {
    return this.appService.handleTransaction(transactionHash);
  }
}
