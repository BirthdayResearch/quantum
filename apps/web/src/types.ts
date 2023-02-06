/**
 * Place for common types we want to reuse in entire app
 */

export enum Network {
  Ethereum = "Ethereum",
  DeFiChain = "DeFiChain",
}

export enum NetworkName {
  Ethereum = "ERC20",
  DeFiChain = "DeFiChain",
}

export enum NetworkEnvironment {
  mainnet = "mainnet",
  testnet = "testnet",
  local = "regtest",
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
  networkEnv: NetworkEnvironment;
  amount: string;
  toAddress: string;
  fromAddress: string;
  dfcUniqueAddress?: string;
}

export type Erc20Token = "wBTC" | "USDT" | "USDC" | "ETH";

export interface ContractContextI {
  BridgeProxyContractAddress: `0x${string}`;
  Erc20Tokens: Record<Erc20Token, `0x${string}`>;
}
