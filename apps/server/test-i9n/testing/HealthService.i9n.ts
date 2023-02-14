import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';

import { DeFiChainStubContainer, StartedDeFiChainStubContainer } from '../defichain/containers/DeFiChainStubContainer';
import { BridgeServerTestingApp } from './BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from './TestingModule';

describe('Health Service Test', () => {
  let testing: BridgeServerTestingApp;
  let startedPostgresContainer: StartedPostgreSqlContainer;
  let defichain: StartedDeFiChainStubContainer;

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();

    defichain = await new DeFiChainStubContainer().start();
    const whaleURL = await defichain.getWhaleURL();
    testing = new BridgeServerTestingApp(
      TestingModule.register(
        buildTestConfig({
          defichain: { whaleURL, key: StartedDeFiChainStubContainer.LOCAL_MNEMONIC },
          startedPostgresContainer,
        }),
      ),
    );

    await testing.start();
  });

  afterAll(async () => {
    await testing.stop();
    await startedPostgresContainer.stop();
    await defichain.stop();
  });

  it('Health check service should be ok', async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/health`,
    });
    expect(JSON.parse(txReceipt.payload).status).toStrictEqual('ok');
  });

  it('Health check service should be error when database is down', async () => {
    await startedPostgresContainer.stop();

    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/health`,
    });

    expect(JSON.parse(txReceipt.payload).status).toStrictEqual('error');
    expect(JSON.parse(txReceipt.payload).error.database.status).toStrictEqual('down');
  });
});
