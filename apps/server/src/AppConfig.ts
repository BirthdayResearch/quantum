import * as Joi from 'joi';

export function appConfig() {
  return {
    defichain: {
      mainnet: process.env.DEFICHAIN_MAINNET_KEY,
      regtest:
        process.env.DEFICHAIN_REGTEST_KEY ||
        'avoid between cupboard there nerve sugar quote foot broom intact seminar culture much anger hold rival moral silly volcano fog service decline tortoise combine',
    },
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'localhost:8545',
    },
    contract: {
      bridgeProxy: {
        mainnetAddress: undefined,
        testnetAddress: '0x93fE70235854e7c97A5db5ddfC6eAAb078e99d3C',
      },
    },
  };
}
export type AppConfig = {
  defichain?: {
    mainnet?: string;
    regtest?: string;
  };
  ethereum?: {
    rpcUrl?: string;
  };
  contract?: {
    bridgeProxy?: {
      mainnetAddress?: string;
      testnetAddress?: string;
    };
  };
};

export const ENV_VALIDATION_SCHEMA = Joi.object({
  ETHEREUM_RPC_URL: Joi.string().ip(),
  DEFICHAIN_MAINNET_KEY: Joi.string(),
  DEFICHAIN_REGTEST_KEY: Joi.string(),
});
