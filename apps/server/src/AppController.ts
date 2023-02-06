import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BigNumber, Event } from 'ethers';

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

  @Get('getAllEventsFromBlockNumber')
  async getAllEventsFromBlockNumber(): Promise<Event[]> {
    return this.appService.getAllEventsFromBlockNumber();
  }

  @Post('initDatabase')
  async initDatabase(@Body() body: Prisma.blockNumberCreateManyInput): Promise<Prisma.BatchPayload> {
    return this.appService.initDatabase(body);
  }

  @Delete('initDatabase')
  async deleteDatabase(): Promise<Prisma.BatchPayload> {
    return this.appService.deleteDatabase();
  }
}
