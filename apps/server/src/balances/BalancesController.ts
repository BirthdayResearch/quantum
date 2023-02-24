import { Controller, Get } from '@nestjs/common';

import { Balances } from './BalancesInterface';
import { BalancesService } from './BalancesService';

@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get()
  async getBalances(): Promise<Balances> {
    return this.balancesService.getBalances();
  }
}
