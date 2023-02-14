import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';

import { PrismaService } from '../../src/PrismaService';
import { BridgeServerTestingApp } from './BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from './TestingModule';

describe('Health Service Test', () => {
  let testing: BridgeServerTestingApp;
  let startedPostgresContainer: StartedPostgreSqlContainer;
  let prismaService: PrismaService;

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();

    testing = new BridgeServerTestingApp(
      TestingModule.register(
        buildTestConfig({
          startedPostgresContainer,
        }),
      ),
    );

    const app = await testing.start();
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await testing.stop();
    await startedPostgresContainer.stop();
  });

  it('Health check service should be ok', async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/health`,
    });
    expect(JSON.parse(txReceipt.payload).status).toStrictEqual('ok');
  });

  it('Health check service should be error when database is down', async () => {
    // mock error on Prisma query
    jest.spyOn(prismaService, '$queryRaw').mockRejectedValue(new Error('Database Error!'));

    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/health`,
    });

    expect(JSON.parse(txReceipt.payload).status).toStrictEqual('error');
    expect(JSON.parse(txReceipt.payload).error.database.status).toStrictEqual('down');
  });
});
