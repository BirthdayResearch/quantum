import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';

describe('DeFiChain Wallet Integration Testing', () => {
  let testing: BridgeServerTestingApp;

  beforeAll(async () => {
    testing = new BridgeServerTestingApp(TestingModule.register(buildTestConfig()));
    await testing.start();
  });

  afterAll(async () => {
    await testing.stop();
  });

  it('should be able to make calls to DeFiChain server', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `/defichain/stats?network=${EnvironmentNetwork.RemotePlayground}`,
    });

    await expect(initialResponse.statusCode).toStrictEqual(200);
  });

  // TODO: Check why network validation fails on unit tests but works on actual server
  it.skip('should fail network validation', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: '/defichain/stats?network=DevTest',
    });
    await expect(initialResponse.statusCode).toStrictEqual(500);
    await expect(initialResponse.statusMessage).toStrictEqual('Internal Server Error');
  });
});
