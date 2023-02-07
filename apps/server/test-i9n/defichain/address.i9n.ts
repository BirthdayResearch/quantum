import { fromAddress } from '@defichain/jellyfish-address';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';
import { DeFiChainStubContainer } from './DeFiChainStubContainer';

describe('DeFiChain Address Integration Testing', () => {
  // Tests are slower because it's running 3 containers at the same time
  jest.setTimeout(3600000);
  let testing: BridgeServerTestingApp;
  let defichain: DeFiChainStubContainer;
  const WALLET_ENDPOINT = `/defichain/wallet/`;

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

  it('should be able to generate a wallet address', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `${WALLET_ENDPOINT}generate-address?network=${EnvironmentNetwork.LocalPlayground}`,
    });

    await expect(initialResponse.statusCode).toStrictEqual(200);
    const decodedAddress = fromAddress(initialResponse.body, 'regtest');
    await expect(decodedAddress).not.toBeUndefined();
  });

  it('should be able to generate a wallet address for a specific network', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `${WALLET_ENDPOINT}generate-address?network=${EnvironmentNetwork.LocalPlayground}`,
    });

    await expect(initialResponse.statusCode).toStrictEqual(200);
    // will return undefined if the address is not a valid address or not a network address
    const decodedAddress = fromAddress(initialResponse.body, 'mainnet');
    await expect(decodedAddress).toBeUndefined();
  });

  it('should be able to fail rate limiting for generating addresses', async () => {
    for (let x = 0; x < 5; x += 1) {
      const initialResponse = await testing.inject({
        method: 'GET',
        url: `${WALLET_ENDPOINT}generate-address?network=${EnvironmentNetwork.LocalPlayground}`,
      });

      expect(initialResponse.statusCode).toStrictEqual(x < 3 ? 200 : 429);
    }
  });
});
