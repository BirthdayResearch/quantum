import { Controller, Get, Query } from '@nestjs/common';

import { NetworkDto } from '../model/NetworkDto';
import { WhaleWalletService } from '../services/WhaleWalletService';

@Controller('/wallet')
export class WhaleWalletController {
  constructor(private readonly whaleWalletService: WhaleWalletService) {}

  @Get('generate-address')
  async get(@Query() query: NetworkDto): Promise<string> {
    return this.whaleWalletService.generateAddress(query.network);
  }
}
