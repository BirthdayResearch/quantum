import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';
import { DeFiChainStubContainer } from './DeFiChainStubContainer';

let defichain: DeFiChainStubContainer;
let testing: BridgeServerTestingApp;
describe('DeFiChain Stats Testing', () => {
  // Tests are slower because it's running 3 containers at the same time
  jest.setTimeout(3600000);
  beforeAll(async () => {
    defichain = await new DeFiChainStubContainer();
    const localWhaleURL = await defichain.start();
    testing = new BridgeServerTestingApp(
      TestingModule.register(
        buildTestConfig({ defichain: { localWhaleURL, localDefichainKey: DeFiChainStubContainer.LOCAL_MNEMONIC } }),
      ),
    );

    await testing.start();
  });

  afterAll(async () => {
    await testing.stop();
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
