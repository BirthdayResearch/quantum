import { EnvironmentNetwork } from "@waveshq/walletkit-core";
/**
 * Place for common types we want to reuse in entire app
 */

import BigNumber from "bignumber.js";

export enum Network {
  Ethereum = "Ethereum",
  DeFiChain = "DeFiChain",
}

export interface TokenDetailI {
  name: string;
  symbol: string;
  icon: string;
  supply: string;
}

export interface AddressDetails {
  address: string;
  refundAddress: string;
  createdAt: Date;
}
export interface BridgeVersion {
  v: string;
}

interface Settings {
  transferFee: `${number}` | number;
  supportedTokens: string[];
}

export interface BridgeSettings {
  defichain: Settings;
  ethereum: Settings;
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
  name: Network;
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
  networkName: Network;
  networkIcon: string;
  tokenName: string;
  tokenSymbol: string;
  tokenIcon: string;
  amount: BigNumber;
}

export interface TransferData {
  from: RowDataI;
  to: RowDataI;
}

export type Erc20Token = "wBTC" | "USDT" | "USDC" | "ETH";

interface ContractConfigI {
  address: `0x${string}`;
  abi?: any;
}

export interface ContractContextI {
  EthereumRpcUrl: string;
  ExplorerURL: string;
  BridgeV1: ContractConfigI;
  Erc20Tokens: Record<Erc20Token, ContractConfigI>;
}

export enum CustomErrorCodes {
  AddressNotOwned = 0,
  AddressNotFound = 1,
  AddressNotValid = 2,
  BalanceNotMatched = 3,
  IsZeroBalance = 4,
  AmountNotValid = 5,
}

export interface SignedClaim {
  signature: string;
  nonce: number;
  deadline: number;
}
