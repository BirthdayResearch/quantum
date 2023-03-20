import BigNumber from 'bignumber.js';
import { IsDateString, IsOptional } from 'class-validator';

import { SupportedDFCTokenSymbols } from '../AppConfig';
import { Iso8601DateOnlyString } from '../utils/StatsUtils';

const defaultValue = new BigNumber(0).toFixed(6);

export class DeFiChainStats {
  readonly totalTransactions: number;

  readonly confirmedTransactions: number;

  readonly amountBridged: BridgedDfcToEvm;

  constructor(totalTransactions: number, confirmedTransactions: number, amountBridged: BridgedDfcToEvm) {
    this.totalTransactions = totalTransactions;
    this.confirmedTransactions = confirmedTransactions;
    this.amountBridged = {
      USDC: amountBridged[SupportedDFCTokenSymbols.USDC]?.toString() || defaultValue,
      USDT: amountBridged[SupportedDFCTokenSymbols.USDT]?.toString() || defaultValue,
      BTC: amountBridged[SupportedDFCTokenSymbols.BTC]?.toString() || defaultValue,
      ETH: amountBridged[SupportedDFCTokenSymbols.ETH]?.toString() || defaultValue,
      DFI: amountBridged[SupportedDFCTokenSymbols.DFI]?.toString() || defaultValue,
      EUROC: amountBridged[SupportedDFCTokenSymbols.EUROC]?.toString() || defaultValue,
    };
  }
}

export type BridgedDfcToEvm = Record<SupportedDFCTokenSymbols, string>;

export class DFCStatsDto {
  @IsDateString()
  @IsOptional()
  date?: Iso8601DateOnlyString;
}
