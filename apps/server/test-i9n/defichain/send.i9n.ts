import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { WhaleWalletAccount } from '@defichain/whale-api-wallet';
import BigNumber from 'bignumber.js';

import { WhaleWalletProvider } from '../../src/defichain/providers/WhaleWalletProvider';
import { SendService } from '../../src/defichain/services/SendService';
import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';
import { DeFiChainStubContainer, StartedDeFiChainStubContainer } from './containers/DeFiChainStubContainer';

let defichain: StartedDeFiChainStubContainer;
let testing: BridgeServerTestingApp;

describe('DeFiChain Send Transaction Testing', () => {
  // Tests are slower because it's running 3 containers at the same time
  jest.setTimeout(3600000);
  let whaleWalletProvider: WhaleWalletProvider;
  let sendService: SendService;
  let fromWallet: string;
  let wallet: WhaleWalletAccount;
  const toAddress = 'bcrt1q8rfsfny80jx78cmk4rsa069e2ckp6rn83u6ut9';
  let postgres: StartedPostgreSqlContainer;

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer().start();

    defichain = await new DeFiChainStubContainer().start();
    const whaleURL = await defichain.getWhaleURL();
    const dynamicModule = TestingModule.register(
      buildTestConfig({
        defichain: { whaleURL, key: StartedDeFiChainStubContainer.LOCAL_MNEMONIC },
        postgres,
      }),
    );
    testing = new BridgeServerTestingApp(dynamicModule);
    const app = await testing.start();

    sendService = app.get<SendService>(SendService);
    whaleWalletProvider = app.get<WhaleWalletProvider>(WhaleWalletProvider);
    wallet = whaleWalletProvider.createWallet();
    fromWallet = await wallet.getAddress();
  });

  afterAll(async () => {
    await testing.stop();
    await defichain.stop();
  });

  it('should be able to send tokens (BTC)', async () => {
    const token = { symbol: 'BTC', id: '1', amount: new BigNumber(1) };
    // Top up UTXO
    await defichain.playgroundRpcClient?.wallet.sendToAddress(fromWallet, 1);
    await defichain.generateBlock();

    // Sends token to the address
    await defichain.playgroundClient?.rpc.call(
      'sendtokenstoaddress',
      [
        {},
        {
          [fromWallet]: `10@BTC`,
        },
      ],
      'number',
    );
    await defichain.generateBlock();

    // Send 1 BTC to specified address
    const txid = await sendService.send(toAddress, token);
    expect(txid).toBeDefined();

    await defichain.generateBlock();

    // Check balance if was sent properly
    const response = await defichain.whaleClient?.address.listToken(toAddress);
    expect(response?.[0].id).toStrictEqual(token.id);
    expect(response?.[0].amount).toStrictEqual(token.amount.toFixed(8));
    expect(response?.[0].symbol).toStrictEqual(token.symbol);
  });

  it('should be able to send DFI (UTXO)', async () => {
    const token = { symbol: 'DFI', id: '0', amount: new BigNumber(0.1) };

    // Top up UTXO
    await defichain.playgroundRpcClient?.wallet.sendToAddress(fromWallet, 1);
    await defichain.generateBlock();

    // Send 0.1 DFI to specified address
    const txid = await sendService.send(toAddress, token);
    expect(txid).toBeDefined();

    await defichain.generateBlock();

    // Check if DFI UTXO was sent properly
    const response = await defichain.whaleClient?.address.getBalance(toAddress);
    expect(response).toStrictEqual(token.amount.toFixed(8));
  });
});
