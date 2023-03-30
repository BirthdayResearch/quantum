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

  it(`should throw an error if fromDate invalid`, async () => {
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

  it(`should throw an error if fromDate is in the future`, async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/ethereum/transactions?fromDate=2033-03-15&toDate=2033-03-16`,
    });

    const parsedPayload = JSON.parse(txReceipt.payload);

    expect(parsedPayload.statusCode).toStrictEqual(400);
    expect(parsedPayload.error).toStrictEqual('API call for Ethereum transactions was unsuccessful');
    expect(parsedPayload.message).toStrictEqual('Cannot query future date');
  });

  it(`should throw an error if toDate is in the future`, async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/ethereum/transactions?fromDate=2023-03-15&toDate=2033-03-16`,
    });

    const parsedPayload = JSON.parse(txReceipt.payload);

    expect(parsedPayload.statusCode).toStrictEqual(400);
    expect(parsedPayload.error).toStrictEqual('API call for Ethereum transactions was unsuccessful');
    expect(parsedPayload.message).toStrictEqual('Cannot query future date');
  });

  it(`should throw an error fromDate is more recent than toDate`, async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/ethereum/transactions?fromDate=2023-03-15&toDate=2023-03-14`,
    });

    const parsedPayload = JSON.parse(txReceipt.payload);

    expect(parsedPayload.statusCode).toStrictEqual(400);
    expect(parsedPayload.error).toStrictEqual('API call for Ethereum transactions was unsuccessful');
    expect(parsedPayload.message).toStrictEqual('fromDate cannot be more recent than toDate');
  });

  it(`should accept a valid fromDate & toDate pair`, async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/ethereum/transactions?fromDate=2023-03-15&toDate=2023-03-16`,
    });

    const parsedPayload = JSON.parse(txReceipt.payload);
    expect(parsedPayload).toBeTruthy();
  });
});
