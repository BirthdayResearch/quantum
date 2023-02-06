import {EnvironmentNetwork} from '@waveshq/walletkit-core';

import {BridgeServerTestingApp} from '../../src/BridgeServerTestingApp';
import {buildTestConfig, TestingExampleModule} from '../BridgeApp.i9n';
import {DeFiChainContainer} from "./DeFiChainContainer";
import {SendService} from "../../src/defichain/services/SendService";
import {TransactionService} from "../../src/defichain/services/TransactionService";
import {WhaleWalletProvider} from "../../src/defichain/providers/WhaleWalletProvider";
import {WhaleApiClientProvider} from "../../src/defichain/providers/WhaleApiClientProvider";
import {WhaleApiService} from "../../src/defichain/services/WhaleApiService";
import BigNumber from 'bignumber.js';

let defichain: DeFiChainContainer;
let testing: BridgeServerTestingApp;

describe('DeFiChain Send Transaction Testing', () => {
  let whaleWalletProvider: WhaleWalletProvider;
  let sendService: SendService;

  beforeAll(async () => {
    defichain = await new DeFiChainContainer();
    const localWhaleURL = await defichain.start();
    const dynamicModule = TestingExampleModule.register(buildTestConfig({ localWhaleURL, localDefichainKey: defichain.localMnemonic  }))
    dynamicModule.providers = [TransactionService, SendService, WhaleWalletProvider, WhaleApiClientProvider, WhaleApiService]
    testing = new BridgeServerTestingApp(dynamicModule);
    const app = await testing.start();
    sendService = app.get<SendService>(SendService);
    whaleWalletProvider = app.get<WhaleWalletProvider>(WhaleWalletProvider);
  });

  afterAll(async () => {
    await defichain.stop();
  });

  it('should be able to initialize the Send Service', async () => {
    expect(sendService).toBeDefined();
  });

  it('should be able to send tokens', async () => {
    const wallet = whaleWalletProvider.createWallet(EnvironmentNetwork.LocalPlayground);
    const fromWallet = await wallet.getAddress();
    // Top of Tokens via Playground network
    const toAddress = "bcrt1q8rfsfny80jx78cmk4rsa069e2ckp6rn83u6ut9";

    // Top up UTXO
    await defichain.playgroundRpcClient?.wallet.sendToAddress(fromWallet, 1);
    await defichain.generateBlock();
    // Sends token to the address
    await defichain.playgroundClient?.rpc.call(
        "sendtokenstoaddress",
        [
          {},
          {
            [fromWallet]: `10@BTC`,
          },
        ],
        "number"
    );
    await defichain.generateBlock();
    const resp = await sendService.send(toAddress, new BigNumber(1), { symbol: "BTC", id: "1", amount: "0" } as any, EnvironmentNetwork.LocalPlayground);
    console.log(resp);
  });
});
