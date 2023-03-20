import { IsDateString, IsOptional } from 'class-validator';

import { SupportedEVMTokenSymbols } from '../AppConfig';
import { Iso8601DateOnlyString } from '../utils/StatsUtils';

export class StatsQueryDto {
  @IsOptional()
  @IsDateString()
  date?: Iso8601DateOnlyString;
}

export class StatsDto {
  readonly totalTransactions: number;

  readonly confirmedTransactions: number;

  readonly amountBridged: {
    USDC: string;
    USDT: string;
    WBTC: string;
    ETH: string;
    EUROC: string;
  };

  constructor(
    totalTransactions: number,
    confirmedTransactions: number,
    amountBridged: Record<SupportedEVMTokenSymbols, string>,
  ) {
    this.totalTransactions = totalTransactions;
    this.confirmedTransactions = confirmedTransactions;
    this.amountBridged = {
      USDC: amountBridged[SupportedEVMTokenSymbols.USDC]?.toString(),
      USDT: amountBridged[SupportedEVMTokenSymbols.USDT]?.toString(),
      WBTC: amountBridged[SupportedEVMTokenSymbols.WBTC]?.toString(),
      ETH: amountBridged[SupportedEVMTokenSymbols.ETH]?.toString(),
      EUROC: amountBridged[SupportedEVMTokenSymbols.EUROC]?.toString(),
    };
  }
}
