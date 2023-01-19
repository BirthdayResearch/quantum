import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import { HardhatNetwork, HardhatNetworkContainer, StartedHardhatNetworkContainer } from 'smartcontracts';

import { AppModule } from '../src/AppModule';
import { BridgeServerTestingApp } from '../src/BridgeServerTestingApp';

@Module({})
export class TestingExampleModule {
  static register(startedHardhatContainer: StartedHardhatNetworkContainer): DynamicModule {
    const hardhatConfig = registerAs('ethereum', () => ({
      ethereumRpcUrl: startedHardhatContainer.rpcUrl,
    }));

    return {
      module: TestingExampleModule,
      imports: [AppModule, ConfigModule.forFeature(hardhatConfig)],
    };
  }
}

describe('Bridge Service Integration Tests', () => {
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let testing: BridgeServerTestingApp;

  beforeAll(async () => {
    startedHardhatContainer = await new HardhatNetworkContainer().start();
    hardhatNetwork = await startedHardhatContainer.ready();
    testing = new BridgeServerTestingApp(TestingExampleModule.register(startedHardhatContainer));
    await testing.start();
  });

  afterAll(async () => {
    await hardhatNetwork.stop();
  });

  it('should be able to make calls to the underlying hardhat node', async () => {
    // Given an initial block height of 1000 (due to the initial block generation when calling HardhatNetwork.ready())
    const initialResponse = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });

    await expect(initialResponse.body).toStrictEqual('1000');

    // When one block is mined
    await hardhatNetwork.generate(1);

    // Then the new block height should be 1
    const responseAfterGenerating = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });

    expect(responseAfterGenerating.body).toStrictEqual('1001');
  });

  // Sample only, will re-org once we have proper layers
  it('should be able to make calls to DeFiChain server', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: '/defichain/stats?network=regtest',
    });

    await expect(initialResponse.statusCode).toStrictEqual(200);
  });

  it('should fail network validation', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: '/defichain/stats?network=devtest',
    });

    await expect(initialResponse.statusCode).toStrictEqual(500);
    await expect(initialResponse.statusMessage).toStrictEqual('Internal Server Error');
  });
});
