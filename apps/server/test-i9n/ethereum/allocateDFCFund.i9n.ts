import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { WhaleWalletAccount } from '@defichain/whale-api-wallet';
import { EthereumTransactionStatus } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
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
    await defichain.generateBlock();
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

  it('should allocate DFC fund by txnId to receiving address', async () => {
    // Step 1: Call bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount) function (bridge 100 USDC) and mine the block
    const transactionCall = await bridgeContract.bridgeToDeFiChain(
      ethers.utils.toUtf8Bytes(address),
      musdcContract.address,
      new BigNumber(1).multipliedBy(new BigNumber(10).pow(18)).toFixed(0),
    );

    // to test pending transaction (unmined block)
    let txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/handleTransaction`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 0, isConfirmed: false });

    await hardhatNetwork.generate(1);

    // Step 2: db should not have record of transaction
    let transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord).toStrictEqual(null);

    txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/handleTransaction`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 0, isConfirmed: false });

    // Step 3: db should create a record of transaction with status='NOT_CONFIRMED', as number of confirmations = 0.
    transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual(EthereumTransactionStatus.NOT_CONFIRMED);

    // Check transaction is not yet confirmed error
    let sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(sendTransactionDetails.statusCode).toStrictEqual(500);
    let response = JSON.parse(sendTransactionDetails.body);
    expect(response.error).toContain('Transaction is not yet confirmed with min block threshold');

    // Step 4: mine 65 blocks to make the transaction confirmed
    await hardhatNetwork.generate(65);

    // Check transaction is not yet confirmed error
    sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(sendTransactionDetails.statusCode).toStrictEqual(500);
    response = JSON.parse(sendTransactionDetails.body);
    expect(response.error).toContain('Transaction is not yet confirmed');

    // Step 5: service should update record in db with status='CONFIRMED', as number of confirmations now hit 65.
    txReceipt = await testing.inject({
      method: 'POST',
      url: `/ethereum/handleTransaction`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual({ numberOfConfirmations: 65, isConfirmed: true });

    // Step 6: call allocate DFC fund
    sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    const res = JSON.parse(sendTransactionDetails.body);
    transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.sendTransactionHash).toStrictEqual(res.transactionHash);
    expect(transactionDbRecord?.status).toStrictEqual(EthereumTransactionStatus.CONFIRMED);
    await defichain.generateBlock();

    // check token gets transferred to the address
    const listToken = await defichain.whaleClient?.address.listToken(address);
    expect(listToken?.[0].id).toStrictEqual('5');
    expect(listToken?.[0].amount).toStrictEqual(new BigNumber(1).toFixed(8));
    expect(listToken?.[0].symbol).toStrictEqual('USDC');

    // check fund is already allocated
    sendTransactionDetails = await testing.inject({
      method: 'POST',
      url: `/ethereum/allocateDFCFund`,
      payload: {
        transactionHash: transactionCall.hash,
      },
    });
    expect(sendTransactionDetails.statusCode).toStrictEqual(500);
    response = JSON.parse(sendTransactionDetails.body);
    expect(response.error).toContain('Fund already allocated');
  });
});
