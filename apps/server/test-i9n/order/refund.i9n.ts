import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import {
  BridgeV1,
  HardhatNetwork,
  HardhatNetworkContainer,
  StartedHardhatNetworkContainer,
  TestToken,
} from 'smartcontracts';

import { PrismaService } from '../../src/PrismaService';
import { StartedDeFiChainStubContainer } from '../defichain/containers/DeFiChainStubContainer';
import { BridgeContractFixture } from '../testing/BridgeContractFixture';
import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';

let startedPostgresContainer: StartedPostgreSqlContainer;
let testing: BridgeServerTestingApp;

describe('Request Refund Testing', () => {
  let prismaService: PrismaService;
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let bridgeContract: BridgeV1;
  let bridgeContractFixture: BridgeContractFixture;
  let musdcContract: TestToken;

  const validTxnHash = '0x09bf1c99b2383677993378227105c938d4fc2a2a8998d6cd35fccd75ee5b3834';

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();
    startedHardhatContainer = await new HardhatNetworkContainer().start();
    hardhatNetwork = await startedHardhatContainer.ready();

    bridgeContractFixture = new BridgeContractFixture(hardhatNetwork);
    await bridgeContractFixture.setup();

    ({ bridgeProxy: bridgeContract, musdc: musdcContract } =
      bridgeContractFixture.contractsWithAdminAndOperationalSigner);

    const dynamicModule = TestingModule.register(
      buildTestConfig({
        defichain: { key: StartedDeFiChainStubContainer.LOCAL_MNEMONIC },
        startedHardhatContainer,
        testnet: { bridgeContractAddress: bridgeContract.address },
        startedPostgresContainer,
        usdcAddress: musdcContract.address,
      }),
    );

    testing = new BridgeServerTestingApp(dynamicModule);
    const app = await testing.start();
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prismaService.ethereumOrders.deleteMany({});
    await startedPostgresContainer.stop();
    await testing.stop();
  });

  it('Should be able to update order status to REFUND_REQUESTED', async () => {
    await prismaService.ethereumOrders.create({
      data: {
        transactionHash: validTxnHash,
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

    // Check that order details exists in the database
    const dbRecord = await prismaService.ethereumOrders.findFirst({
      where: { transactionHash: validTxnHash },
    });

    expect(dbRecord?.transactionHash).toStrictEqual(validTxnHash);

    const resp = await testing.inject({
      method: 'PUT',
      url: `/ethereum/order/${validTxnHash}/refund`,
    });

    expect(resp.body).toStrictEqual({
      id: '1',
      transactionHash: validTxnHash,
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

    expect(resp.statusCode).toEqual(500);
    expect(JSON.parse(resp.body).error).toEqual(
      "API call for refund was unsuccessful: Cannot read properties of null (reading 'data')",
    );
  });

  it('Should not be able to update order status when transactionHash is invalid', async () => {
    const resp = await testing.inject({
      method: 'PUT',
      url: `/ethereum/order/1234/refund`,
    });

    expect(JSON.parse(resp.body).message).toEqual('Invalid Ethereum transaction hash: 1234');
  });
});
