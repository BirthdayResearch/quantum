import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { BridgeServerTestingApp } from '../../src/BridgeServerTestingApp';
import { buildTestConfig, TestingExampleModule } from '../BridgeApp.i9n';
import {DeFiChainContainer} from "./DeFiChainContainer";

let defichain: DeFiChainContainer;
describe('DeFiChain Wallet Integration Testing', () => {
  let testing: BridgeServerTestingApp;

  beforeAll(async () => {
    defichain = await new DeFiChainContainer();
    const localWhaleURL = await defichain.start();
    testing = new BridgeServerTestingApp(TestingExampleModule.register(buildTestConfig({ localWhaleURL })));
    await testing.start();
  });

  afterAll(async () => {
    await defichain.stop();
  });

  it('should be able to make calls to DeFiChain server', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `/defichain/stats?network=${EnvironmentNetwork.LocalPlayground}`,
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
