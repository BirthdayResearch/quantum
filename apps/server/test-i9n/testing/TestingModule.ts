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
}: DeepPartial<BuildTestConfigParams> = {}) {
  return {
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

interface BuildTestConfigParams {
  defichain: {
    whaleURL: string;
    key: string;
    network: string;
  };
  startedHardhatContainer: StartedHardhatNetworkContainer;
  testnet: {
    bridgeContractAddress: string;
  };
}
