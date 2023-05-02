import { describe } from 'node:test';

import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { QueueStatus } from '@prisma/client';

import { Queue } from '../../src/ethereum/queue/model/Queue';
import { PrismaService } from '../../src/PrismaService';
import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';

describe('Get and List from EthereumQueue table', () => {
  let prismaService: PrismaService;
  let startedPostgresContainer: StartedPostgreSqlContainer;
  let testing: BridgeServerTestingApp;

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

    // init postgres database
    prismaService = app.get<PrismaService>(PrismaService);

    // create 20 items in database
    let count = 1;
    while (count <= 20) {
      await prismaService.ethereumQueue.create({
        data: {
          transactionHash: `0x09bf1c99b2383677993378227105c938d4fc2a2a8998d6cd35fccd75ee5b383${count}`,
          ethereumStatus: 'NOT_CONFIRMED',
          status: QueueStatus.DRAFT,
          createdAt: '2023-04-20T06:14:43.847Z',
          updatedAt: '2023-04-20T06:28:17.185Z',
          amount: null,
          tokenSymbol: null,
          defichainAddress: '',
          expiryDate: '1970-01-01T00:00:00.000Z',
        },
      });
      count += 1;
    }
  });

  afterAll(async () => {
    await prismaService.ethereumQueue.deleteMany({});
    await startedPostgresContainer.stop();
    await testing.stop();
  });

  it('Should throw error when status provided is not valid', async () => {
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list?status=INVALID_STATUS`,
    });

    const data = JSON.parse(resp.body);
    expect(data.message).toStrictEqual(
      'Invalid query parameter value. See the acceptable values: DRAFT, IN_PROGRESS, COMPLETED, ERROR, REJECTED, EXPIRED, REFUND_REQUESTED, REFUND_PROCESSED, REFUNDED',
    );
  });

  it('Should be able to list 10 items without indicating size or next page', async () => {
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list`,
    });

    const { data } = JSON.parse(resp.body);
    expect(data.length).toStrictEqual(10);
    expect(data[0].id).toStrictEqual('1');
    expect(data[data.length - 1].id).toStrictEqual('10');
  });

  it('Should be able to get next 10 items', async () => {
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list`,
    });

    // get next page
    const { next } = JSON.parse(resp.body).page;
    expect(next).toStrictEqual('11');

    const nextPageResp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list?next=${next}`,
    });
    const { data } = JSON.parse(nextPageResp.body);
    expect(data.length).toStrictEqual(10);
    expect(data[0].id).toStrictEqual('11');
    expect(data[data.length - 1].id).toStrictEqual('20');
  });

  it('Should not have next page when there is no more data on next', async () => {
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list`,
    });

    // get next page
    const { next } = JSON.parse(resp.body).page;
    expect(next).toStrictEqual('11');

    const nextPageResp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list?next=${next}`,
    });
    const { data } = JSON.parse(nextPageResp.body);
    expect(data.length).toStrictEqual(10);
    expect(data[0].id).toStrictEqual('11');
    expect(data[data.length - 1].id).toStrictEqual('20');

    // there should be no next page returned
    expect(JSON.parse(nextPageResp.body).page).toBeUndefined();
  });

  it('Should be able to set size of the list', async () => {
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list?size=5`,
    });

    const { data } = JSON.parse(resp.body);
    const { page } = JSON.parse(resp.body);

    expect(data.length).toStrictEqual(5);
    expect(page.next).toStrictEqual('6');
  });

  it('Should be able to set size and next page', async () => {
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list?size=5`,
    });

    const { data } = JSON.parse(resp.body);
    const { page } = JSON.parse(resp.body);

    expect(data.length).toStrictEqual(5);

    const nextPageResp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list?size=5&next=${page.next}`,
    });

    const nextPageData = JSON.parse(nextPageResp.body).data;
    const nextPage = JSON.parse(nextPageResp.body).page;

    expect(nextPageData.length).toStrictEqual(5);
    expect(nextPageData[0].id).toStrictEqual('6');
    expect(nextPageData[nextPageData.length - 1].id).toStrictEqual('10');
    expect(nextPage.next).toStrictEqual('11');
  });

  it('Should not have next page when size === data.length', async () => {
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list?size=20`,
    });
    const { page } = JSON.parse(resp.body);
    expect(page).toBeUndefined();
  });

  it('Should be able to list by status and size', async () => {
    await prismaService.ethereumQueue.create({
      data: {
        transactionHash: `0x09bf1c99b2383677993378227105c938d4fc2a2a8998d6cd35fccd75ee5b38398`,
        ethereumStatus: 'NOT_CONFIRMED',
        status: QueueStatus.IN_PROGRESS,
        createdAt: '2023-04-20T06:14:43.847Z',
        updatedAt: '2023-04-20T06:28:17.185Z',
        amount: null,
        tokenSymbol: null,
        defichainAddress: '',
        expiryDate: '1970-01-01T00:00:00.000Z',
      },
    });

    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list?size=30&status=DRAFT`,
    });

    const { data } = JSON.parse(resp.body);

    expect(data.length).toStrictEqual(20);
    data.forEach((queue: Queue) => {
      expect(queue.status).toStrictEqual(QueueStatus.DRAFT);
    });

    const inProgResp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list?size=30&status=IN_PROGRESS`,
    });

    const inProgData = JSON.parse(inProgResp.body).data;
    expect(inProgData.length).toStrictEqual(1);
    expect(inProgData[0].status).toStrictEqual(QueueStatus.IN_PROGRESS);
  });

  it('Should be able to list by status and size and next', async () => {
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/queue/list?size=5&status=DRAFT`,
    });

    const { data } = JSON.parse(resp.body);
    const { page } = JSON.parse(resp.body);

    expect(page.next).toStrictEqual('6');
    expect(data.length).toStrictEqual(5);
    data.forEach((queue: Queue) => {
      expect(queue.status).toStrictEqual(QueueStatus.DRAFT);
    });
  });
});
