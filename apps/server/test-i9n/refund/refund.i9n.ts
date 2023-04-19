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
  });

  afterAll(async () => {
    await prismaService.ethereumOrderTable.deleteMany({});
    await startedPostgresContainer.stop();
    await testing.stop();
  });

  it('Should be able to update order status to REFUND_REQUESTED', async () => {
    const resp = await testing.inject({
      method: 'POST',
      url: `/requestRefundOrder?transactionHash=1234`,
    });

    expect(resp.body).toStrictEqual('Refund_Requested for 1234');
  });

  it('Should not be able to update order status when transactionHash is invalid', async () => {
    const resp = await testing.inject({
      method: 'POST',
      url: `/requestRefundOrder?transactionHash=1234`,
    });

    expect(resp.body).toHaveProperty('API call for requestRefundOrder was unsuccessful:');
  });
});
