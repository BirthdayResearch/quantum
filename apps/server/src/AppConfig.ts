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
      minimumEVMBlockNumber: process.env.MINIMUM_BLOCK_NUMBER,
      contracts: {
        bridgeProxy: {
          address: process.env.BRIDGE_PROXY_ADDRESS,
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
