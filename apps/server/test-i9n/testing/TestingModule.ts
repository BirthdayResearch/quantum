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
      [EnvironmentNetwork.LocalPlayground]: defichain?.localDefichainKey ?? '',
      localWhaleURL: defichain?.localWhaleURL ?? '',
    },
    ethereum: {
      testnet: {
        rpcUrl: startedHardhatContainer?.rpcUrl ?? '',
        contracts: {
          bridgeProxy: {
            address: testnet?.bridgeContractAddress ?? '',
          },
        },
      },
    },
  };
}

interface BuildTestConfigParams {
  defichain: {
    localWhaleURL: string;
    localDefichainKey: string;
  };
  startedHardhatContainer: StartedHardhatNetworkContainer;
  testnet: {
    bridgeContractAddress: string;
  };
}
