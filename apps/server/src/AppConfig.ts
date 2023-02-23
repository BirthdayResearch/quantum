import * as Joi from 'joi';

export const DATABASE_URL = 'DATABASE_URL';

export function appConfig() {
  return {
    dbUrl: process.env.DATABASE_URL,
    defichain: {
      key: process.env.DEFICHAIN_PRIVATE_KEY,
      whaleURL: process.env.DEFICHAIN_WHALE_URL,
      network: process.env.DEFICHAIN_NETWORK,
    },
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL,
      transferFee: process.env.ETH_FEE_PERCENTAGE,
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
});

export enum SupportedEVMTokenSymbols {
  USDC = 'USDC',
  USDT = 'USDT',
  WBTC = 'WBTC',
  ETH = 'ETH',
}
export enum SupportedDFCTokenSymbols {
  USDC = 'USDC',
  USDT = 'USDT',
  BTC = 'BTC',
  ETH = 'ETH',
  DFI = 'DFI',
}
