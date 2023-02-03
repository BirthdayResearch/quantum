import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { Network } from '@prisma/client';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime';
import { execSync } from 'child_process';

import { Prisma } from '../src/prisma/Client';

describe('PostgreSql container', () => {
  const container = new PostgreSqlContainer();
  let postgreSqlContainer: StartedPostgreSqlContainer;

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
  });

  afterAll(async () => {
    await postgreSqlContainer.stop();
  });

  it('should be able to create pathIndex records', async () => {
    const data = [
      {
        index: 0,
        address: 'Address 0',
        network: Network.Playground,
        refundAddress: 'bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g',
      },
      {
        index: 1,
        address: 'Address 1',
        network: Network.Playground,
        refundAddress: 'bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g',
      },
    ];
    await Prisma.pathIndex.createMany({ data });
    const count = await Prisma.pathIndex.count();
    expect(count).toStrictEqual(2);
  });

  it('should throw error by passing duplicate index', async () => {
    const data = {
      index: 2,
      address: 'Address 2',
      network: Network.Playground,
      refundAddress: 'bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g',
    };
    await Prisma.pathIndex.create({ data });
    await expect(Prisma.pathIndex.create({ data })).rejects.toBeInstanceOf(PrismaClientKnownRequestError);
  });

  it('should throw error by passing wrong index type', async () => {
    const data = {
      index: 'string',
      address: 'Address 0',
      network: Network.Playground,
      refundAddress: 'bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g',
    };
    // @ts-ignore
    await expect(Prisma.pathIndex.create({ data })).rejects.toBeInstanceOf(PrismaClientValidationError);
  });

  it('should save valid data in database', async () => {
    const data = {
      index: 3,
      address: 'Address 3',
      network: Network.Playground,
      refundAddress: 'bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g',
    };
    await Prisma.pathIndex.create({ data });
    const response = await Prisma.pathIndex.findFirst({
      where: { index: data.index },
    });
    expect(Number(response?.index)).toEqual(data.index);
    expect(response?.address).toEqual(data.address);
  });

  it('should throw error by passing wrong index type', async () => {
    const data = [
      {
        index: 11,
        address: 'Address 0',
        network: Network.MainNet,
        refundAddress: 'bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g',
      },
      {
        index: 11,
        address: 'Address 0',
        network: Network.TestNet,
        refundAddress: 'bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g',
      },
    ];
    await Prisma.pathIndex.createMany({ data });
    const response = await Prisma.pathIndex.findMany({
      where: {
        index: 11,
      },
    });
    expect(response.length).toStrictEqual(2);
  });
});
