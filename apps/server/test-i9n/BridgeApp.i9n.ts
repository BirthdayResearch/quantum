import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import { ethers } from 'ethers';
import {
  BridgeV1,
  HardhatNetwork,
  HardhatNetworkContainer,
  StartedHardhatNetworkContainer,
  TestToken,
} from 'smartcontracts';

import { PrismaService } from '../src/PrismaService';
import { BridgeContractFixture } from './testing/BridgeContractFixture';
import { BridgeServerTestingApp } from './testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from './testing/TestingModule';

const execAsync = promisify(exec);

describe('Bridge Service Integration Tests', () => {
  jest.setTimeout(3600000);
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let testing: BridgeServerTestingApp;
  let bridgeContract: BridgeV1;
  let bridgeContractFixture: BridgeContractFixture;
  let musdcContract: TestToken;
  let prismaService: PrismaService;

  beforeAll(async () => {
    await execAsync(`./with-db generate && ./with-db migrate dev`);
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
        buildTestConfig({ startedHardhatContainer, testnet: { bridgeContractAddress: bridgeContract.address } }),
      ),
    );
    const app = await testing.start();

    // init postgres database
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await hardhatNetwork.stop();
    await testing.stop();
    // teardown database
    await prismaService.bridgeEventTransactions.deleteMany({});
  });

  it('Validates that the transaction inputted is of the correct format', async () => {
    const txReceipt = await testing.inject({
      method: 'POST',
      url: `/app/handleTransaction`,
      payload: {
        transactionHash: 'wrong_transaction_test',
      },
    });
    expect(JSON.parse(txReceipt.body).error).toBe('Bad Request');
    expect(JSON.parse(txReceipt.body).message).toBe('Invalid Ethereum transaction hash: wrong_transaction_test');
    expect(JSON.parse(txReceipt.body).statusCode).toBe(400);
  });

  it('Checks if a transaction is confirmed, and stores it in the database', async () => {
    // Step 1: Call bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount) function and mine the block
    const transactionCall = await bridgeContract.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      musdcContract.address,
      ethers.utils.parseEther('5'),
    );
    await hardhatNetwork.generate(1);

    // Step 2: db should not have record of transaction
    let transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord).toStrictEqual(null);

    let txReceipt = await testing.inject({
      method: 'POST',
      url: `/app/handleTransaction`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual(false);

    // Step 3: db should create a record of transaction with status='NOT_CONFIRMED', as number of confirmations = 0.
    transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual('NOT_CONFIRMED');

    // Step 4: mine 65 blocks to make the transaction confirmed
    await hardhatNetwork.generate(65);

    // Step 5: service should update record in db with status='CONFIRMED', as number of confirmations now hit 65.
    txReceipt = await testing.inject({
      method: 'POST',
      url: `/app/handleTransaction`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual(true);

    transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual('CONFIRMED');
  });
});
