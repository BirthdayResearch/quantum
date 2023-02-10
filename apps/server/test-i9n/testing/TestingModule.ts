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

export function buildTestConfig({ startedHardhatContainer, testnet, defichain, postgres }: BuildTestConfigParams) {
  if (postgres === undefined) {
    throw Error('Must pass in started postgres container');
  }
  const dbUrl = `postgres://${postgres.getUsername()}:${postgres.getPassword()}@${postgres.getHost()}:${postgres.getPort()}`;
  child_process.execSync(`export DATABASE_URL=${dbUrl} && pnpm prisma migrate deploy`);
  return {
    dbUrl: dbUrl ?? '',
    defichain: {
      key: defichain?.key ?? '',
      whaleURL: defichain?.whaleURL ?? '',
      network: defichain?.network ?? EnvironmentNetwork.LocalPlayground,
    },
    ethereum: {
      rpcUrl: startedHardhatContainer?.rpcUrl ?? '',
      contracts: {
        bridgeProxy: {
          address: testnet?.bridgeContractAddress ?? '',
        },
      },
    },
  };
}

type BuildTestConfigParams = DeepPartial<OptionalBuildTestConfigParams> & {
  postgres: StartedPostgreSqlContainer;
};

type OptionalBuildTestConfigParams = {
  dbUrl: string;
  defichain: {
    whaleURL: string;
    key: string;
    network: string;
  };
  startedHardhatContainer: StartedHardhatNetworkContainer;
  testnet: {
    bridgeContractAddress: string;
  };
};
