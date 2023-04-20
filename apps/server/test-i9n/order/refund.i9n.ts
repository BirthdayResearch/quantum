import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';

import { PrismaService } from '../../src/PrismaService';
import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';

let startedPostgresContainer: StartedPostgreSqlContainer;
let testing: BridgeServerTestingApp;

describe('Request Refund Testing', () => {
  let prismaService: PrismaService;

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();
    const dynamicModule = TestingModule.register(buildTestConfig({ startedPostgresContainer }));
    testing = new BridgeServerTestingApp(dynamicModule);
    const app = await testing.start();
    prismaService = app.get<PrismaService>(PrismaService);

    prismaService.ethereumOrders.create({
      data: {
        transactionHash: '0x09bf1c99b2383677993378227105c938d4fc2a2a8998d6cd35fccd75ee5b3834',
        ethereumStatus: 'NOT_CONFIRMED',
        status: 'DRAFT',
        createdAt: '2023-04-20T06:14:43.847Z',
        updatedAt: '2023-04-20T06:28:17.185Z',
        amount: null,
        tokenSymbol: null,
        defichainAddress: '',
        expiryDate: '1970-01-01T00:00:00.000Z',
      },
    });
  });

  afterAll(async () => {
    await prismaService.ethereumOrders.deleteMany({});
    await startedPostgresContainer.stop();
    await testing.stop();
  });

  it('Should be able to update order status to REFUND_REQUESTED', async () => {
    const resp = await testing.inject({
      method: 'PUT',
      url: `/ethereum/order/0x09bf1c99b2383677993378227105c938d4fc2a2a8998d6cd35fccd75ee5b3834/refund`,
    });

    expect(resp.body).toStrictEqual({
      id: '1',
      transactionHash: '0x09bf1c99b2383677993378227105c938d4fc2a2a8998d6cd35fccd75ee5b3834',
      ethereumStatus: 'NOT_CONFIRMED',
      status: 'REFUND_REQUESTED',
      createdAt: '2023-04-20T06:14:43.847Z',
      updatedAt: '2023-04-20T06:28:17.185Z',
      amount: null,
      tokenSymbol: null,
      defichainAddress: '',
      expiryDate: '1970-01-01T00:00:00.000Z',
    });
  });

  it('Should not be able to find order that transactionHash does not exist in db', async () => {
    const resp = await testing.inject({
      method: 'PUT',
      url: `/ethereum/order/0x09bf1c99b2383677993378227105c938d4fc2a2a8998d6cd35fccd75ee5b3835/refund`,
    });

    expect(resp.body).toHaveProperty(
      "API call for refund was unsuccessful: Cannot read properties of null (reading 'data')",
    );
  });

  it('Should not be able to update order status when transactionHash is invalid', async () => {
    const resp = await testing.inject({
      method: 'PUT',
      url: `/ethereum/order/1234/refund`,
    });

    expect(resp.body).toEqual(
      '{"statusCode":400,"message":"Invalid Ethereum transaction hash: 1234","error":"Bad Request"}',
    );
  });
});
