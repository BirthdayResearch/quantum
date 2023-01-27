import { Body, Controller, Get, ParseIntPipe,Post, Query } from '@nestjs/common';
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

  @Post('getAllEventsFromBlockNumber')
  async getAllEventsFromBlockNumber(
    @Body('blockNumber', ParseIntPipe) blockNumber: number,
    @Body('contractAddress') contractAddress: string,
  ): Promise<object[]> {
    return this.appService.getAllEventsFromBlockNumber(blockNumber, contractAddress);
  }
  // @Get('getAllEventsFromBlockNumber')
  // async getAllEventsFromBlockNumber(@Query('blockNumber') blockNumber:number): Promise<object[]>{
  //   return this.appService.getAllEventsFromBlockNumber(Number(blockNumber))
  // }
}
