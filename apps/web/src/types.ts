import { EnvironmentNetwork } from "@waveshq/walletkit-core";
/**
 * Place for common types we want to reuse in entire app
 */

import BigNumber from "bignumber.js";

export enum Network {
  Ethereum = "Ethereum",
  DeFiChain = "DeFiChain",
}

export enum NetworkName {
  Ethereum = "ERC20",
  DeFiChain = "DeFiChain",
}

export interface TokenDetailI {
  name: string;
  symbol: string;
  icon: string;
  supply: string;
}

export enum SelectionType {
  "Network" = "Network",
  "Token" = "Token",
}

export interface TokensI {
  tokenA: TokenDetailI;
  tokenB: TokenDetailI;
}
export interface NetworkOptionsI {
  name: string;
  icon: string;
  tokens: TokensI[];
}

export interface ProgressStepI {
  step: number;
  label: string;
}

export interface UnconfirmedTxnI {
  selectedNetworkA: NetworkOptionsI;
  selectedTokensA: TokensI;
  selectedNetworkB: NetworkOptionsI;
  selectedTokensB: TokensI;
  networkEnv: EnvironmentNetwork;
  amount: string;
  toAddress: string;
  fromAddress: string;
  dfcUniqueAddress?: string;
}

export interface RowDataI {
  address: string;
  networkName: NetworkName;
  networkIcon: string;
  tokenName: string;
  tokenIcon: string;
  amount: BigNumber;
}

export interface TransferData {
  from: RowDataI;
  to: RowDataI;
}

export type Erc20Token = "wBTC" | "USDT" | "USDC" | "wETH";

interface ContractConfigI {
  address: `0x${string}`;
  abi?: any;
}

export interface ContractContextI {
  ExplorerURL: string;
  EthereumRpcUrl: string;
  BridgeV1: ContractConfigI;
  Erc20Tokens: Record<Erc20Token, ContractConfigI>;
}

export interface DailyLimiterContextI {
  dailyLimit: string;
  currentUsage: string;
}
