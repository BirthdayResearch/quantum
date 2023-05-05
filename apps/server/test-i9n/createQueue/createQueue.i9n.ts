import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { EthereumTransactionStatus, QueueStatus } from '@prisma/client';
import { ethers } from 'ethers';
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

describe('Create Queue Service Integration Tests', () => {
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let testing: BridgeServerTestingApp;
  let bridgeContract: BridgeV1;
  let bridgeContractFixture: BridgeContractFixture;
  let musdcContract: TestToken;
  let prismaService: PrismaService;
  let startedPostgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();
    startedHardhatContainer = await new HardhatNetworkContainer().start();
    hardhatNetwork = await startedHardhatContainer.ready();

    bridgeContractFixture = new BridgeContractFixture(hardhatNetwork);
    await bridgeContractFixture.setup();

    // Using the default signer of the container to carry out tests
    ({ bridgeProxy: bridgeContract, musdc: musdcContract } =
      bridgeContractFixture.contractsWithAdminAndOperationalSigner);

    // initialize config variables
    testing = new BridgeServerTestingApp(
      TestingModule.register(
        buildTestConfig({
          defichain: { key: StartedDeFiChainStubContainer.LOCAL_MNEMONIC },
          startedHardhatContainer,
          testnet: { bridgeContractAddress: bridgeContract.address },
          startedPostgresContainer,
          usdcAddress: musdcContract.address,
        }),
      ),
    );
    const app = await testing.start();

    // init postgres database
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // teardown database
    await prismaService.bridgeEventTransactions.deleteMany({});
    await prismaService.ethereumQueue.deleteMany({});
    await prismaService.adminEthereumQueue.deleteMany({});
    await startedPostgresContainer.stop();
    await hardhatNetwork.stop();
    await testing.stop();
  });

  it('Validates that the transaction inputted is of the correct format', async () => {
    const txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/queue`,
      payload: {
        transactionHash: 'wrong_transaction_test',
      },
    });
    expect(JSON.parse(txReceipt.body).error).toBe('Bad Request');
    expect(JSON.parse(txReceipt.body).message).toBe('Invalid Ethereum transaction hash: wrong_transaction_test');
    expect(JSON.parse(txReceipt.body).statusCode).toBe(400);
  });

  it('Check if create queue transaction is stored in database', async () => {
    // Step 1: Call bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount) function (bridge 100 USDC) and mine the block
    const transactionCall = await bridgeContract.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      musdcContract.address,
      5,
    );
    // const test = await prismaService.ethereumQueue.create({
    //   data: {
    //     transactionHash: transactionCall.hash,
    //     ethereumStatus: 'NOT_CONFIRMED',
    //     status: 'DRAFT',
    //     createdAt: '2023-04-20T06:14:43.847Z',
    //     updatedAt: '2023-04-20T06:28:17.185Z',
    //     amount: null,
    //     tokenSymbol: null,
    //     defichainAddress: '',
    //     expiryDate: '1970-01-01T00:00:00.000Z',
    //   },
    // });
    // const dbRecord = await prismaService.ethereumQueue.findFirst({
    //   where: { transactionHash: transactionCall.hash },
    // });
    // console.log(dbRecord);

    let txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/queue`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });

    // expect(txReceipt.body).toStrictEqual(`${transactionCall.hash} is still pending`);

    await hardhatNetwork.generate(1);

    // Step 2: db should not have record of transaction
    let transactionDbRecord = await prismaService.ethereumQueue.findFirst({
      where: { transactionHash: transactionCall.hash },
    });

    expect(transactionDbRecord).toStrictEqual(null);

    txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/queue`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });

    // const dbRecord = await prismaService.ethereumQueue.findFirst({
    //   where: { transactionHash: transactionCall.hash },
    // });

    // to test pending transaction (unmined block)
    txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/queue/verify`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 0, isConfirmed: false });

    // Step 3: db should create a record of transaction with status='NOT_CONFIRMED', as number of confirmations = 0.
    transactionDbRecord = await prismaService.ethereumQueue.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual(QueueStatus.DRAFT);
    expect(transactionDbRecord?.status).toStrictEqual(EthereumTransactionStatus.NOT_CONFIRMED);

    // Step 4: mine 65 blocks to make the transaction confirmed
    await hardhatNetwork.generate(65);

    // Step 5: service should update record in db with status='CONFIRMED', as number of confirmations now hit 65.
    txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/queue/verify`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 65, isConfirmed: true });

    transactionDbRecord = await prismaService.ethereumQueue.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual(QueueStatus.IN_PROGRESS);
    expect(transactionDbRecord?.status).toStrictEqual(EthereumTransactionStatus.CONFIRMED);
  });
});
