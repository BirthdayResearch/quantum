import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { WhaleWalletAccount } from '@defichain/whale-api-wallet';
import { EthereumTransactionStatus } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { ContractTransaction, ethers } from 'ethers';
import {
  BridgeV1,
  HardhatNetwork,
  HardhatNetworkContainer,
  StartedHardhatNetworkContainer,
  TestToken,
} from 'smartcontracts';

import { WhaleWalletProvider } from '../../src/defichain/providers/WhaleWalletProvider';
import { PrismaService } from '../../src/PrismaService';
import { DeFiChainStubContainer, StartedDeFiChainStubContainer } from '../defichain/containers/DeFiChainStubContainer';
import { sleep } from '../helper/sleep';
import { BridgeContractFixture } from '../testing/BridgeContractFixture';
import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';

describe('Bridge Service Allocate DFC Fund Integration Tests', () => {
  jest.setTimeout(3600000);
  const address = 'bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g';
  let defichain: StartedDeFiChainStubContainer;
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let testing: BridgeServerTestingApp;
  let bridgeContract: BridgeV1;
  let bridgeContractFixture: BridgeContractFixture;
  let musdcContract: TestToken;
  let prismaService: PrismaService;
  let startedPostgresContainer: StartedPostgreSqlContainer;
  let whaleWalletProvider: WhaleWalletProvider;
  let fromWallet: string;
  let wallet: WhaleWalletAccount;
  let transactionCall: ContractTransaction;

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();
    startedHardhatContainer = await new HardhatNetworkContainer().start();
    hardhatNetwork = await startedHardhatContainer.ready();

    bridgeContractFixture = new BridgeContractFixture(hardhatNetwork);
    await bridgeContractFixture.setup();

    // Using the default signer of the container to carry out tests
    ({ bridgeProxy: bridgeContract, musdc: musdcContract } =
      bridgeContractFixture.contractsWithAdminAndOperationalSigner);
    defichain = await new DeFiChainStubContainer().start();
    const whaleURL = await defichain.getWhaleURL();
    // initialize config variables
    testing = new BridgeServerTestingApp(
      TestingModule.register(
        buildTestConfig({
          startedHardhatContainer,
          defichain: { whaleURL, key: StartedDeFiChainStubContainer.LOCAL_MNEMONIC },
          testnet: { bridgeContractAddress: bridgeContract.address },
          startedPostgresContainer,
          usdcAddress: musdcContract.address,
        }),
      ),
    );
    const app = await testing.start();

    whaleWalletProvider = app.get<WhaleWalletProvider>(WhaleWalletProvider);
    wallet = whaleWalletProvider.getHotWallet();
    fromWallet = await wallet.getAddress();

    // Top up UTXO
    await defichain.playgroundRpcClient?.wallet.sendToAddress(fromWallet, 1);
    await defichain.generateBlock();
    // Sends token to the address
    await defichain.playgroundClient?.rpc.call(
      'sendtokenstoaddress',
      [
        {},
        {
          [fromWallet]: `10@USDC`,
        },
      ],
      'number',
    );
    await defichain.playgroundClient?.rpc.call(
      'sendtokenstoaddress',
      [
        {},
        {
          [fromWallet]: `10@ETH`,
        },
      ],
      'number',
    );
    await defichain.generateBlock();
    // init postgres database
    prismaService = app.get<PrismaService>(PrismaService);

    // Step 1: Call bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount) function (bridge 1 USDC) and mine the block
    transactionCall = await bridgeContract.bridgeToDeFiChain(
      ethers.utils.toUtf8Bytes(address),
      musdcContract.address,
      new BigNumber(1).multipliedBy(new BigNumber(10).pow(18)).toFixed(0),
    );
    await hardhatNetwork.generate(1);
  });

  afterAll(async () => {
    // teardown database
    await prismaService.bridgeEventTransactions.deleteMany({});
    await startedPostgresContainer.stop();
    await hardhatNetwork.stop();
    await testing.stop();
  });

  it('should fail api request before handleTransaction api call', async () => {
    const transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord).toStrictEqual(null);
    const sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(sendTransactionDetails.statusCode).toStrictEqual(500);
    const response = JSON.parse(sendTransactionDetails.body);
    expect(response.error).toContain('Transaction detail not available');
  });

  it('should fail api request when transaction is not yet confirmed', async () => {
    // Step 2: db should not have record of transaction
    const txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/handleTransaction`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 0, isConfirmed: false });

    // Step 3: db should create a record of transaction with status='NOT_CONFIRMED', as number of confirmations = 0.
    const transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual(EthereumTransactionStatus.NOT_CONFIRMED);

    const sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(sendTransactionDetails.statusCode).toStrictEqual(500);
    const response = JSON.parse(sendTransactionDetails.body);
    expect(response.error).toContain('Transaction is not yet confirmed');
  });

  it('should fail api request when transaction is not yet confirmed and db entry gets updated with confirmed status', async () => {
    // update txn as confirmed manually
    await prismaService.bridgeEventTransactions.update({
      where: {
        transactionHash: transactionCall.hash,
      },
      data: {
        status: EthereumTransactionStatus.CONFIRMED,
      },
    });

    const sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(sendTransactionDetails.statusCode).toStrictEqual(500);
    const response = JSON.parse(sendTransactionDetails.body);
    expect(response.error).toContain('Transaction is not yet confirmed with min block threshold');
    // reverted update of txn as confirmed manually
    await prismaService.bridgeEventTransactions.update({
      where: {
        transactionHash: transactionCall.hash,
      },
      data: {
        status: EthereumTransactionStatus.NOT_CONFIRMED,
      },
    });
  });

  it('should allocate USDC DFC fund by txnId to receiving address', async () => {
    // Step 4: mine 65 blocks to make the transaction confirmed
    await hardhatNetwork.generate(65);
    // Step 5: service should update record in db with status='CONFIRMED', as number of confirmations now hit 65.
    const txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/handleTransaction`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 65, isConfirmed: true });

    // Step 6: call allocate DFC fund
    const sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    const res = JSON.parse(sendTransactionDetails.body);
    const transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.sendTransactionHash).toStrictEqual(res.transactionHash);
    expect(transactionDbRecord?.status).toStrictEqual(EthereumTransactionStatus.CONFIRMED);
    await defichain.generateBlock();

    // check token gets transferred to the address
    const listToken = await defichain.whaleClient?.address.listToken(address);
    const token = listToken.find((each) => each.id === '5');
    expect(token?.id).toStrictEqual('5');
    expect(token?.amount).toStrictEqual(new BigNumber(1).toFixed(8));
    expect(token?.symbol).toStrictEqual('USDC');
  });

  it('should fail when fund already allocated', async () => {
    const sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(sendTransactionDetails.statusCode).toStrictEqual(500);
    const response = JSON.parse(sendTransactionDetails.body);
    expect(response.error).toContain('Fund already allocated');
  });

  it('should fail when invalid address is provided as send address', async () => {
    await sleep(60000);
    // Step 1: Call bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount) function (bridge 1 USDC) and mine the block
    const invalidTransactionCall = await bridgeContract.bridgeToDeFiChain(
      ethers.utils.toUtf8Bytes('df1q4q49nwn7s8l6fsdpkmhvf0als6jawktg8urd3u'),
      musdcContract.address,
      new BigNumber(1).multipliedBy(new BigNumber(10).pow(18)).toFixed(0),
    );
    await hardhatNetwork.generate(1);

    // Step 2: db should not have record of transaction
    let transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: invalidTransactionCall.hash },
    });
    expect(transactionDbRecord).toStrictEqual(null);

    let txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/handleTransaction`,
      payload: {
        transactionHash: invalidTransactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 0, isConfirmed: false });

    // Step 3: db should create a record of transaction with status='NOT_CONFIRMED', as number of confirmations = 0.
    transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: invalidTransactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual(EthereumTransactionStatus.NOT_CONFIRMED);

    // Step 4: mine 65 blocks to make the transaction confirmed
    await hardhatNetwork.generate(65);

    // Check transaction is not yet confirmed error
    let sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: invalidTransactionCall.hash,
      },
    });
    expect(sendTransactionDetails.statusCode).toStrictEqual(500);
    let response = JSON.parse(sendTransactionDetails.body);
    expect(response.error).toContain('Transaction is not yet confirmed');

    // Step 5: service should update record in db with status='CONFIRMED', as number of confirmations now hit 65.
    txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/handleTransaction`,
      payload: {
        transactionHash: invalidTransactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 65, isConfirmed: true });

    // Step 6: call allocate DFC fund
    sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: invalidTransactionCall.hash,
      },
    });
    response = JSON.parse(sendTransactionDetails.body);
    expect(response.error).toContain('Invalid send address for DeFiChain');
    transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: invalidTransactionCall.hash },
    });
    expect(transactionDbRecord?.sendTransactionHash).toStrictEqual(null);
  });

  it('should allocate ETH DFC fund by txnId to receiving address', async () => {
    await sleep(60000);
    // Step 1: Call bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount) function (bridge 1 ETH) and mine the block
    const ethTransactionCall = await bridgeContract.bridgeToDeFiChain(
      ethers.utils.toUtf8Bytes(address),
      ethers.constants.AddressZero,
      0,
      {
        value: ethers.utils.parseEther('1'),
      },
    );
    await hardhatNetwork.generate(1);

    // Step 2: db should not have record of transaction
    let transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: ethTransactionCall.hash },
    });
    expect(transactionDbRecord).toStrictEqual(null);

    let txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/handleTransaction`,
      payload: {
        transactionHash: ethTransactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 0, isConfirmed: false });

    // Step 3: db should create a record of transaction with status='NOT_CONFIRMED', as number of confirmations = 0.
    transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: ethTransactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual(EthereumTransactionStatus.NOT_CONFIRMED);

    // Step 4: mine 65 blocks to make the transaction confirmed
    await hardhatNetwork.generate(65);

    // Check transaction is not yet confirmed error
    let sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: ethTransactionCall.hash,
      },
    });
    expect(sendTransactionDetails.statusCode).toStrictEqual(500);
    const response = JSON.parse(sendTransactionDetails.body);
    expect(response.error).toContain('Transaction is not yet confirmed');

    // Step 5: service should update record in db with status='CONFIRMED', as number of confirmations now hit 65.
    txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/handleTransaction`,
      payload: {
        transactionHash: ethTransactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 65, isConfirmed: true });

    // Step 6: call allocate DFC fund
    sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: ethTransactionCall.hash,
      },
    });
    const res = JSON.parse(sendTransactionDetails.body);
    transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: ethTransactionCall.hash },
    });
    expect(transactionDbRecord?.sendTransactionHash).toStrictEqual(res.transactionHash);
    expect(transactionDbRecord?.status).toStrictEqual(EthereumTransactionStatus.CONFIRMED);
    await defichain.generateBlock();

    // check token gets transferred to the address
    const listToken = await defichain.whaleClient?.address.listToken(address);
    const token = listToken.find((each) => each.id === '2');
    expect(token?.id).toStrictEqual('2');
    expect(token?.amount).toStrictEqual(new BigNumber(1).toFixed(8));
    expect(token?.symbol).toStrictEqual('ETH');
  });
});
