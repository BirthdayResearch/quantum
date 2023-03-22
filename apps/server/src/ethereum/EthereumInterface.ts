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

  readonly amountBridged: Record<SupportedEVMTokenSymbols, string>;

  readonly totalBridgedAmount: Record<SupportedEVMTokenSymbols, string>;

  constructor(
    totalTransactions: number,
    confirmedTransactions: number,
    amountBridged: Record<SupportedEVMTokenSymbols, string>,
    totalBridgedAmount: Record<SupportedEVMTokenSymbols, string>,
  ) {
    this.totalTransactions = totalTransactions;
    this.confirmedTransactions = confirmedTransactions;
    this.amountBridged = amountBridged;
    this.totalBridgedAmount = totalBridgedAmount;
  }
}

export type BridgedEVMTokenSum = {
  tokenSymbol: SupportedEVMTokenSymbols;
  totalAmount: string;
};
