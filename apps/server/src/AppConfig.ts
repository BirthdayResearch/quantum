import * as Joi from 'joi';

export function appConfig() {
  return {
    defichain: {
      key: process.env.DEFICHAIN_PRIVATE_KEY,
      whaleURL: process.env.DEFICHAIN_WHALE_URL,
      network: process.env.DEFICHAIN_NETWORK,
    },
    ethereum: {
      testnet: {
        rpcUrl: process.env.ETHEREUM_RPC_URL,
        contracts: {
          bridgeProxy: {
            // https://goerli.etherscan.io/address/0x93fE70235854e7c97A5db5ddfC6eAAb078e99d3C
            address: '0x93fE70235854e7c97A5db5ddfC6eAAb078e99d3C',
          },
        },
      },
      mainnet: {
        contracts: {
          bridgeProxy: {
            address: undefined,
          },
        },
      },
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
  ETHEREUM_RPC_URL: Joi.string().ip(),
  DEFICHAIN_NETWORK: Joi.string(),
  DEFICHAIN_WHALE_URL: Joi.string().ip(),
});
