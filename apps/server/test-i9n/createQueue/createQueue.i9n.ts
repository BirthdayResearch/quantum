import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { DeFiChainTransactionStatus,EthereumTransactionStatus, QueueStatus } from '@prisma/client';
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
    // Step 1: Call bridgeToDeFiChain( test defi wallet address, _tokenAddress, _amount) function (bridge 5 USDC) and mine the block
    const transactionCall = await bridgeContract.bridgeToDeFiChain(
      ethers.utils.toUtf8Bytes('df1q4q49nwn7s8l6fsdpkmhvf0als6jawktg8urd3u'),
      musdcContract.address,
      5,
    );

    await hardhatNetwork.generate(1);

    // Step 2: db should not have record of transaction
    let transactionDbRecord = await prismaService.ethereumQueue.findFirst({
      where: { transactionHash: transactionCall.hash },
    });

    expect(transactionDbRecord).toStrictEqual(null);

    let transactionAdminDbRecord = await prismaService.adminEthereumQueue.findFirst({
      where: { queueTransactionHash: transactionCall.hash },
    });
    expect(transactionAdminDbRecord).toStrictEqual(null);

    const txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/queue`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });

    expect(txReceipt.statusCode).toStrictEqual(201);
    expect(JSON.parse(txReceipt.body).status).toStrictEqual(QueueStatus.DRAFT);
    expect(JSON.parse(txReceipt.body).ethereumStatus).toStrictEqual(EthereumTransactionStatus.NOT_CONFIRMED);

    // to test pending transaction (unmined block)
    let txnResponse = await testing.inject({
      method: 'POST',
      url: `/ethereum/queue/verify`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txnResponse.body)).toStrictEqual({ numberOfConfirmations: 0, isConfirmed: false });

    // Step 3: db should create a record of transaction with status='NOT_CONFIRMED', as number of confirmations = 0.
    transactionDbRecord = await prismaService.ethereumQueue.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual(QueueStatus.DRAFT);
    expect(transactionDbRecord?.ethereumStatus).toStrictEqual(EthereumTransactionStatus.NOT_CONFIRMED);

    // Step 4: mine 65 blocks to make the transaction confirmed
    await hardhatNetwork.generate(65);

    // Step 5: service should update record in db with status='CONFIRMED', as number of confirmations now hit 65.
    txnResponse = await testing.inject({
      method: 'POST',
      url: `/ethereum/queue/verify`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txnResponse.body)).toStrictEqual({ numberOfConfirmations: 65, isConfirmed: true });

    transactionDbRecord = await prismaService.ethereumQueue.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual(QueueStatus.IN_PROGRESS);
    expect(transactionDbRecord?.ethereumStatus).toStrictEqual(EthereumTransactionStatus.CONFIRMED);

    transactionAdminDbRecord = await prismaService.adminEthereumQueue.findFirst({
      where: { queueTransactionHash: transactionCall.hash },
    });
    expect(transactionAdminDbRecord?.queueTransactionHash).toStrictEqual(transactionCall.hash);
    expect(transactionAdminDbRecord?.defichainStatus).toStrictEqual(DeFiChainTransactionStatus.NOT_CONFIRMED);
  });
});