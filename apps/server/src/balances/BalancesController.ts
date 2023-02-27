import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { Balances } from './BalancesInterface';
import { BalancesService } from './BalancesService';

@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Throttle(50, 60)
  @Get()
  async getBalances(): Promise<Balances> {
    return this.balancesService.getBalances();
  }
}
