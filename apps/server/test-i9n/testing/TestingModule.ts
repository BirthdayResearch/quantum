import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

export function buildTestConfig({ startedHardhatContainer, testnet }: DeepPartial<BuildTestConfigParams> = {}) {
  return {
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
  startedHardhatContainer: StartedHardhatNetworkContainer;
  testnet: {
    bridgeContractAddress: string;
  };
}
