import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { WhaleWalletAccount } from '@defichain/whale-api-wallet';
import {
  BridgeV1,
  HardhatNetwork,
  HardhatNetworkContainer,
  StartedHardhatNetworkContainer,
  TestToken,
} from 'smartcontracts';

import { DeFiChainStats } from '../../src/defichain/DefichainInterface';
import { WhaleWalletProvider } from '../../src/defichain/providers/WhaleWalletProvider';
import { PrismaService } from '../../src/PrismaService';
import { BridgeContractFixture } from '../testing/BridgeContractFixture';
import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';
import { DeFiChainStubContainer, StartedDeFiChainStubContainer } from './containers/DeFiChainStubContainer';

describe('DeFiChain Stats Testing', () => {
  let defichain: StartedDeFiChainStubContainer;
  let testing: BridgeServerTestingApp;
  let startedPostgresContainer: StartedPostgreSqlContainer;
  let prismaService: PrismaService;

  let bridgeContract: BridgeV1;
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let bridgeContractFixture: BridgeContractFixture;
  let ethWalletAddress: string;
  let mwbtcContract: TestToken;

  // Tests are slower because it's running 3 containers at the same time
  jest.setTimeout(3600000);
  let whaleWalletProvider: WhaleWalletProvider;
  let localAddress: string;
  let wallet: WhaleWalletAccount;
  let hotWalletAddress: string;
  let hotWallet: WhaleWalletAccount;
  const WALLET_ENDPOINT = `/defichain/wallet/`;
  const VERIFY_ENDPOINT = `${WALLET_ENDPOINT}verify`;

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();
    defichain = await new DeFiChainStubContainer().start();
    const whaleURL = await defichain.getWhaleURL();

    // Hardhat - get signer
    startedHardhatContainer = await new HardhatNetworkContainer().start();
    hardhatNetwork = await startedHardhatContainer.ready();
    bridgeContractFixture = new BridgeContractFixture(hardhatNetwork);
    ethWalletAddress = await hardhatNetwork.contractSigner.getAddress();
    await bridgeContractFixture.setup();
    ({ bridgeProxy: bridgeContract, musdt: mwbtcContract } =
      bridgeContractFixture.contractsWithAdminAndOperationalSigner);

    testing = new BridgeServerTestingApp(
      TestingModule.register(
        buildTestConfig({
          defichain: {
            whaleURL,
            key: StartedDeFiChainStubContainer.LOCAL_MNEMONIC,
            transferFee: '0.003',
            dustUTXO: '0.001',
            supportedTokens: 'BTC,ETH',
          },
          startedHardhatContainer,
          testnet: {
            bridgeContractAddress: bridgeContract.address,
            ethWalletPrivKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // local hardhat wallet
          },
          startedPostgresContainer,
        }),
      ),
    );

    const app = await testing.start();

    // init postgres database
    prismaService = app.get<PrismaService>(PrismaService);

    whaleWalletProvider = app.get<WhaleWalletProvider>(WhaleWalletProvider);
    wallet = whaleWalletProvider.createWallet(2);
    localAddress = await wallet.getAddress();
    hotWallet = await whaleWalletProvider.getHotWallet();
    hotWalletAddress = await hotWallet.getAddress();
  });

  afterAll(async () => {
    // teardown database
    await prismaService.deFiChainAddressIndex.deleteMany({});
    await testing.stop();
    await startedPostgresContainer.stop();
    await defichain.stop();
  });

  type MockedPayload = {
    amount: string;
    symbol: string;
    address: string;
    ethReceiverAddress: string;
    tokenAddress: string;
  };

  async function verify(mockedPayload: MockedPayload) {
    const initialResponse = await testing.inject({
      method: 'POST',
      url: `${VERIFY_ENDPOINT}`,
      payload: mockedPayload,
    });
    const response = JSON.parse(initialResponse.body);

    return response;
  }

  function verifyFormat(parsedPayload: DeFiChainStats) {
    expect(parsedPayload).toHaveProperty('totalTransactions');
    expect(parsedPayload).toHaveProperty('confirmedTransactions');
    expect(parsedPayload).toHaveProperty('amountBridged');
    expect(parsedPayload).toHaveProperty('totalBridgedAmount');

    expect(parsedPayload.amountBridged).toHaveProperty('USDC');
    expect(parsedPayload.amountBridged).toHaveProperty('USDT');
    expect(parsedPayload.amountBridged).toHaveProperty('BTC');
    expect(parsedPayload.amountBridged).toHaveProperty('ETH');
    expect(parsedPayload.amountBridged).toHaveProperty('DFI');
    expect(parsedPayload.amountBridged).toHaveProperty('EUROC');

    expect(parsedPayload.totalBridgedAmount).toHaveProperty('USDC');
    expect(parsedPayload.totalBridgedAmount).toHaveProperty('USDT');
    expect(parsedPayload.totalBridgedAmount).toHaveProperty('BTC');
    expect(parsedPayload.totalBridgedAmount).toHaveProperty('ETH');
    expect(parsedPayload.totalBridgedAmount).toHaveProperty('DFI');
    expect(parsedPayload.totalBridgedAmount).toHaveProperty('EUROC');
  }

  async function getBalance(tokenSymbol: string) {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `${WALLET_ENDPOINT}balance/${tokenSymbol}`,
    });
    const response = JSON.parse(initialResponse.body);
    return response;
  }

  it('should verify fund is displayed accurately in endpoint', async () => {
    await testing.inject({
      method: 'GET',
      url: `${WALLET_ENDPOINT}address/generate`,
      query: {
        refundAddress: localAddress,
      },
    });

    // Send UTXO to Hot Wallet
    await defichain.playgroundRpcClient?.wallet.sendToAddress(hotWalletAddress, 1);
    await defichain.generateBlock();

    // eslint-disable-next-line
    console.log('hotwalletbalance with api', await getBalance('DFI'));
    // Sends token to the address
    await defichain.playgroundClient?.rpc.call(
      'sendtokenstoaddress',
      [
        {},
        {
          [localAddress]: `10@BTC`,
        },
      ],
      'number',
    );
    await defichain.generateBlock();

    const response = await verify({
      amount: '10',
      symbol: 'BTC',
      address: localAddress,
      ethReceiverAddress: ethWalletAddress,
      tokenAddress: mwbtcContract.address,
    });
    expect(response.isValid).toBeTruthy();
    expect(response.signature).toBeDefined();
    expect(response.nonce).toBeDefined();
    expect(response.deadline).toBeDefined();

    await defichain.generateBlock();
    const claimAmt = await prismaService.deFiChainAddressIndex.findMany({
      where: {
        refundAddress: localAddress,
      },
      select: {
        claimAmount: true,
      },
    });
    expect(claimAmt).not.toBeNull();

    const targetDate = new Date().toISOString().slice(0, 10);

    const initialResponse = await testing.inject({
      method: 'GET',
      url: `/defichain/stats?date=${targetDate}`,
    });

    expect(JSON.parse(initialResponse.payload).confirmedTransactions).toStrictEqual(1);
    expect(JSON.parse(initialResponse.payload).amountBridged.BTC).toStrictEqual('9.970000');
    verifyFormat(JSON.parse(initialResponse.payload));
  });

  it('should be able to make calls to DeFiChain server', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `/defichain/stats`,
    });

    await expect(initialResponse.statusCode).toStrictEqual(200);
  });

  it(`should use today's date if no date is provided by the user`, async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `/defichain/stats`,
    });
    verifyFormat(JSON.parse(initialResponse.payload));
  });

  it(`should return stats for the given date`, async () => {
    const targetDate = '2023-03-11';

    const initialResponse = await testing.inject({
      method: 'GET',
      url: `/defichain/stats?date=${targetDate}`,
    });
    verifyFormat(JSON.parse(initialResponse.payload));
  });

  it(`should throw an error if invalid or no date is provided`, async () => {
    const txReceipt1 = await testing.inject({
      method: 'GET',
      url: `/defichain/stats?date=abc`,
    });

    expect(JSON.parse(txReceipt1.payload).status).toStrictEqual(500);
    expect(JSON.parse(txReceipt1.payload).error).toStrictEqual(
      'API call for DefiChain statistics was unsuccessful: Invalid time value',
    );
  });

  it(`should throw an error if date parameter is missing`, async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/defichain/stats?date=`,
    });

    expect(JSON.parse(txReceipt.payload).status).toStrictEqual(500);
    expect(JSON.parse(txReceipt.payload).error).toStrictEqual(
      'API call for DefiChain statistics was unsuccessful: Invalid time value',
    );
  });

  it(`should be correctly formatted`, async () => {
    const txReceipt = await testing.inject({
      method: 'GET',
      url: `/defichain/stats`,
    });

    const parsedPayload = JSON.parse(txReceipt.payload);

    verifyFormat(parsedPayload);
  });
});
