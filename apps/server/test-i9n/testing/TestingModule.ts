import * as child_process from 'node:child_process';

import { StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { StartedHardhatNetworkContainer } from 'smartcontracts';

import { AppConfig, DeepPartial } from '../../src/AppConfig';
import { AppModule } from '../../src/AppModule';

@Module({})
export class TestingModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: TestingModule,
      imports: [AppModule, ConfigModule.forFeature(() => config)],
    };
  }
}

export function buildTestConfig({
  startedHardhatContainer,
  testnet,
  defichain,
  ethereum,
  startedPostgresContainer,
  usdcAddress,
  usdtAddress,
  wbtcAddress,
}: BuildTestConfigParams) {
  if (startedPostgresContainer === undefined) {
    throw Error('Must pass in StartedPostgresContainer');
  }
  const dbUrl = `postgres://${startedPostgresContainer.getUsername()}:${startedPostgresContainer.getPassword()}@${startedPostgresContainer.getHost()}:${startedPostgresContainer.getPort()}`;
  child_process.execSync(`export DATABASE_URL=${dbUrl} && pnpm prisma migrate deploy`);
  return {
    dbUrl: dbUrl ?? '',
    defichain: {
      key: defichain?.key ?? '',
      whaleURL: defichain?.whaleURL ?? '',
      network: defichain?.network ?? EnvironmentNetwork.LocalPlayground,
      transferFee: defichain?.transferFee,
    },
    ethereum: {
      rpcUrl: startedHardhatContainer?.rpcUrl ?? '',
      transferFee: ethereum?.transferFee,
      contracts: {
        bridgeProxy: {
          address: testnet?.bridgeContractAddress ?? '',
        },
        USDC: {
          address: usdcAddress,
        },
        USDT: {
          address: usdtAddress,
        },
        WBTC: {
          address: wbtcAddress,
        },
      },
      ethWalletPrivKey: testnet?.ethWalletPrivKey,
    },
  };
}

type BuildTestConfigParams = DeepPartial<OptionalBuildTestConfigParams> & {
  startedPostgresContainer: StartedPostgreSqlContainer;
};

type OptionalBuildTestConfigParams = {
  dbUrl: string;
  defichain: {
    whaleURL: string;
    key: string;
    network: string;
    transferFee: string;
    dustUTXO: string;
  };
  ethereum: {
    transferFee: string;
  };
  startedHardhatContainer: StartedHardhatNetworkContainer;
  testnet: {
    bridgeContractAddress: string;
    ethWalletPrivKey: string;
  };
  usdcAddress: string;
  usdtAddress: string;
  wbtcAddress: string;
};
