import * as Joi from 'joi';

export const DATABASE_URL = 'DATABASE_URL';

export function appConfig() {
  return {
    dbUrl: process.env.DATABASE_URL,
    defichain: {
      key: process.env.DEFICHAIN_PRIVATE_KEY,
      whaleURL: process.env.DEFICHAIN_WHALE_URL,
      network: process.env.DEFICHAIN_NETWORK,
      transferFee: process.env.DFC_FEE_PERCENTAGE,
      dustUTXO: process.env.DEFICHAIN_DUST_UTXO,
      supportedTokens: process.env.SUPPORTED_DFC_TOKENS,
      dfcReservedAmt: process.env.DEFICHAIN_RESERVED_AMT,
    },
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL,
      transferFee: process.env.ETH_FEE_PERCENTAGE,
      supportedTokens: process.env.SUPPORTED_EVM_TOKENS,
      contracts: {
        bridgeProxy: {
          address: process.env.BRIDGE_PROXY_ADDRESS,
        },
        queueBridgeProxy: {
          address: process.env.QUANTUM_QUEUE_PROXY_ADDRESS,
        },
        [SupportedEVMTokenSymbols.USDT]: {
          address: process.env.USDT_ADDRESS,
        },
        [SupportedEVMTokenSymbols.USDC]: {
          address: process.env.USDC_ADDRESS,
        },
        [SupportedEVMTokenSymbols.WBTC]: {
          address: process.env.WBTC_ADDRESS,
        },
        [SupportedEVMTokenSymbols.EUROC]: {
          address: process.env.EUROC_ADDRESS,
        },
        [SupportedEVMTokenSymbols.DFI]: {
          address: process.env.DFI_ADDRESS,
        },
      },
      ethWalletPrivKey: process.env.ETHEREUM_WALLET_PRIVATE_KEY,
    },
  };
}

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
export type AppConfig = DeepPartial<ReturnType<typeof appConfig>>;

export const ENV_VALIDATION_SCHEMA = Joi.object({
  ETHEREUM_RPC_URL: Joi.string().uri(),
  DATABASE_URL: Joi.string(),
  DEFICHAIN_NETWORK: Joi.string(),
  DEFICHAIN_WHALE_URL: Joi.string().uri(),
  DEFICHAIN_DUST_UTXO: Joi.string(),
  DEFICHAIN_PRIVATE_KEY: Joi.string(),
  ETHEREUM_WALLET_PRIVATE_KEY: Joi.string(),
  DFC_FEE_PERCENTAGE: Joi.string(),
  ETH_FEE_PERCENTAGE: Joi.string(),
  BRIDGE_PROXY_ADDRESS: Joi.string(),
});

export enum SupportedEVMTokenSymbols {
  USDC = 'USDC',
  USDT = 'USDT',
  WBTC = 'WBTC',
  ETH = 'ETH',
  EUROC = 'EUROC',
  DFI = 'DFI',
}
export enum SupportedDFCTokenSymbols {
  USDC = 'USDC',
  USDT = 'USDT',
  BTC = 'BTC',
  ETH = 'ETH',
  DFI = 'DFI',
  EUROC = 'EUROC',
}

export enum Network {
  Ethereum = 'Ethereum',
  DeFiChain = 'DeFiChain',
}

export interface TokenDetailI<T> {
  name: T;
  subtitle?: string;
  symbol: string;
  icon: string;
}

export interface TokensI {
  tokenA: TokenDetailI<string>;
  tokenB: TokenDetailI<string>;
}

export interface NetworkOptionsI {
  name: Network;
  icon: string;
  tokens: TokensI[];
}

export type Erc20Token = 'WBTC' | 'USDT' | 'USDC' | 'ETH' | 'EUROC' | 'DFI';
export interface NetworkI<T> {
  name: Network;
  icon: string;
  tokens: {
    tokenA: TokenDetailI<T>;
    tokenB: TokenDetailI<string>;
  }[];
}

export const TokensLists: [NetworkI<Erc20Token>, NetworkI<string>] = [
  {
    name: Network.Ethereum,
    icon: '/tokens/Ethereum.svg',
    tokens: [
      {
        tokenA: {
          name: 'DFI',
          subtitle: '(Ethereum)',
          symbol: 'DFI',
          icon: '/tokens/DFI.svg',
        },
        tokenB: {
          name: 'DFI',
          symbol: 'DFI',
          icon: '/tokens/DFI.svg',
        },
      },
      {
        tokenA: {
          name: 'WBTC',
          symbol: 'WBTC',
          icon: '/tokens/wBTC.svg',
        },
        tokenB: {
          name: 'dBTC',
          symbol: 'BTC',
          icon: '/tokens/dBTC.svg',
        },
      },
      {
        tokenA: {
          name: 'ETH',
          symbol: 'ETH',
          icon: '/tokens/ETH.svg',
        },
        tokenB: {
          name: 'dETH',
          symbol: 'ETH',
          icon: '/tokens/dETH.svg',
        },
      },
      {
        tokenA: {
          name: 'USDT',
          symbol: 'USDT',
          icon: '/tokens/USDT.svg',
        },
        tokenB: {
          name: 'dUSDT',
          symbol: 'USDT',
          icon: '/tokens/dUSDT.svg',
        },
      },
      {
        tokenA: {
          name: 'USDC',
          symbol: 'USDC',
          icon: '/tokens/USDC.svg',
        },
        tokenB: {
          name: 'dUSDC',
          symbol: 'USDC',
          icon: '/tokens/dUSDC.svg',
        },
      },
      {
        tokenA: {
          name: 'EUROC',
          symbol: 'EUROC',
          icon: '/tokens/EUROC.svg',
        },
        tokenB: {
          name: 'dEUROC',
          symbol: 'EUROC',
          icon: '/tokens/dEUROC.svg',
        },
      },
    ],
  },
  {
    name: Network.DeFiChain,
    icon: '/tokens/DeFichain.svg',
    tokens: [
      {
        tokenA: {
          name: 'DFI',
          symbol: 'DFI',
          icon: '/tokens/DFI.svg',
        },
        tokenB: {
          name: 'DFI',
          subtitle: '(Ethereum)',
          symbol: 'DFI',
          icon: '/tokens/DFI.svg',
        },
      },
      {
        tokenA: {
          name: 'dBTC',
          symbol: 'BTC',
          icon: '/tokens/dBTC.svg',
        },
        tokenB: {
          name: 'WBTC',
          symbol: 'WBTC',
          icon: '/tokens/wBTC.svg',
        },
      },
      {
        tokenA: {
          name: 'dETH',
          symbol: 'ETH',
          icon: '/tokens/dETH.svg',
        },
        tokenB: {
          name: 'ETH',
          symbol: 'ETH',
          icon: '/tokens/ETH.svg',
        },
      },
      {
        tokenA: {
          name: 'dUSDT',
          symbol: 'USDT',
          icon: '/tokens/dUSDT.svg',
        },
        tokenB: {
          name: 'USDT',
          symbol: 'USDT',
          icon: '/tokens/USDT.svg',
        },
      },
      {
        tokenA: {
          name: 'dUSDC',
          symbol: 'USDC',
          icon: '/tokens/dUSDC.svg',
        },
        tokenB: {
          name: 'USDC',
          symbol: 'USDC',
          icon: '/tokens/USDC.svg',
        },
      },
      {
        tokenA: {
          name: 'dEUROC',
          symbol: 'EUROC',
          icon: '/tokens/dEUROC.svg',
        },
        tokenB: {
          name: 'EUROC',
          symbol: 'EUROC',
          icon: '/tokens/EUROC.svg',
        },
      },
    ],
  },
];
