import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { fromAddress } from '@defichain/jellyfish-address';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { execSync } from 'child_process';

import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';

const sleep = (time: number) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve('');
    }, time);
  });

describe('DeFiChain Wallet Integration Testing', () => {
  const container = new PostgreSqlContainer();
  let postgreSqlContainer: StartedPostgreSqlContainer;
  let testing: BridgeServerTestingApp;
  const WALLET_ENDPOINT = `/defichain/wallet/`;

  beforeAll(async () => {
    postgreSqlContainer = await container
      .withDatabase('bridge')
      .withUsername('playground')
      .withPassword('playground')
      .withExposedPorts({
        container: 5432,
        host: 5432,
      })
      .start();
    // deploy migration
    execSync('pnpm run migration:deploy');
    testing = new BridgeServerTestingApp(TestingModule.register(buildTestConfig()));
    await testing.start();
  });

  afterAll(async () => {
    await testing.stop();
    await postgreSqlContainer.stop();
  });

  it('should be able to generate a wallet address', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `${WALLET_ENDPOINT}address/generate?network=${EnvironmentNetwork.RemotePlayground}&refundAddress=bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g`,
    });
    await expect(initialResponse.statusCode).toStrictEqual(200);
    const response = JSON.parse(initialResponse.body);
    const decodedAddress = fromAddress(response.address, 'regtest');
    await expect(decodedAddress).not.toBeUndefined();
  });

  it('should be able to generate a wallet address for a specific network', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `${WALLET_ENDPOINT}address/generate?network=${EnvironmentNetwork.RemotePlayground}&refundAddress=bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g`,
    });

    await expect(initialResponse.statusCode).toStrictEqual(200);
    // will return undefined if the address is not a valid address or not a network address
    const response = JSON.parse(initialResponse.body);
    const decodedAddress = fromAddress(response.address, 'mainnet');
    await expect(decodedAddress).toBeUndefined();
  });

  it('should be able to fail rate limiting for generating addresses', async () => {
    for (let x = 0; x < 5; x += 1) {
      const initialResponse = await testing.inject({
        method: 'GET',
        url: `${WALLET_ENDPOINT}address/generate?network=${EnvironmentNetwork.RemotePlayground}&refundAddress=bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g`,
      });

      expect(initialResponse.statusCode).toStrictEqual(x < 3 ? 200 : 429);
    }
    // await 1min before continuing further
    await sleep(60000);
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `${WALLET_ENDPOINT}address/generate?network=${EnvironmentNetwork.RemotePlayground}&refundAddress=bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g`,
    });

    expect(initialResponse.statusCode).toStrictEqual(200);
  });

  it('should be able to fail without refund address while creating new address', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `${WALLET_ENDPOINT}address/generate?network=${EnvironmentNetwork.RemotePlayground}`,
    });
    expect(initialResponse.statusCode).toStrictEqual(500);
  });
});
