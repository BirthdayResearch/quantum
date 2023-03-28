import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';

import { StartedDeFiChainStubContainer } from '../../defichain/containers/DeFiChainStubContainer';
import { BridgeServerTestingApp } from '../BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../TestingModule';

describe('Transactions Service Test', () => {
  let testing: BridgeServerTestingApp;
  let startedPostgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();

    testing = new BridgeServerTestingApp(
      TestingModule.register(
        buildTestConfig({
          defichain: { key: StartedDeFiChainStubContainer.LOCAL_MNEMONIC },
          startedPostgresContainer,
        }),
      ),
    );

    await testing.start();
  });

  afterAll(async () => {
    await testing.stop();
  });

  it(`should throw an error if both dates are invalid`, async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/ethereum/transactions?fromDate=abc&toDate=def`,
    });

    const parsedPayload = JSON.parse(txReceipt.payload);

    expect(parsedPayload.statusCode).toStrictEqual(400);
    expect(parsedPayload.message).toStrictEqual([
      'fromDate must be a valid ISO 8601 date string',
      'toDate must be a valid ISO 8601 date string',
    ]);
  });

  it(`should throw an error if both dates are invalid`, async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/ethereum/transactions?fromDate=abc&toDate=2023-03-27`,
    });

    const parsedPayload = JSON.parse(txReceipt.payload);

    expect(parsedPayload.statusCode).toStrictEqual(400);
    expect(parsedPayload.message).toStrictEqual(['fromDate must be a valid ISO 8601 date string']);
  });

  it(`should throw an error if toDate invalid`, async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/ethereum/transactions?fromDate=2023-03-27&toDate=def`,
    });

    const parsedPayload = JSON.parse(txReceipt.payload);

    expect(parsedPayload.statusCode).toStrictEqual(400);
    expect(parsedPayload.message).toStrictEqual(['toDate must be a valid ISO 8601 date string']);
  });

  it(`should throw an error if future date is provided`, async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/ethereum/transactions?fromDate=2033-03-15&toDate=2033-03-16`,
    });

    expect(JSON.parse(txReceipt.payload).status).toStrictEqual(500);
    expect(JSON.parse(txReceipt.payload).error).toStrictEqual(
      'API call for Ethereum transactions was unsuccessful: Cannot query future date',
    );
  });
});
