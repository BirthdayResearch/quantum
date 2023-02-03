import {
  NativeChainContainer,
  PlaygroundApiContainer,
  StartedNativeChainContainer,
  StartedPlaygroundApiContainer,
  StartedWhaleApiContainer,
  WhaleApiContainer,
} from '@defichain/testcontainers';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { HardhatNetwork, HardhatNetworkContainer, StartedHardhatNetworkContainer } from 'smartcontracts';
import { Network } from 'testcontainers';

import { BridgeServerTestingApp } from '../../src/BridgeServerTestingApp';
import { buildTestConfig, TestingExampleModule } from '../BridgeApp.i9n';

let defid: StartedNativeChainContainer;
let whale: StartedWhaleApiContainer;
let playground: StartedPlaygroundApiContainer;
let startedHardhatContainer: StartedHardhatNetworkContainer;
let hardhatNetwork: HardhatNetwork;
let testing: BridgeServerTestingApp;

describe('DeFiChain Transaction Testing', () => {
  beforeAll(async () => {
    startedHardhatContainer = await new HardhatNetworkContainer().start();
    hardhatNetwork = await startedHardhatContainer.ready();
    const network = await new Network().start();
    defid = await new NativeChainContainer().withNetwork(network).withPreconfiguredRegtestMasternode().start();
    whale = await new WhaleApiContainer().withNetwork(network).withNativeChain(defid, network).start();
    playground = await new PlaygroundApiContainer().withNetwork(network).withNativeChain(defid, network).start();
    await playground.waitForReady();
    testing = new BridgeServerTestingApp(TestingExampleModule.register(buildTestConfig({ startedHardhatContainer })));
    await testing.start();
  });

  afterAll(async () => {
    await hardhatNetwork.stop();
    await whale.stop();
    await defid.stop();
    await playground.stop();
  });

  it('should be able to make calls to DeFiChain server', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: `/defichain/stats?network=${EnvironmentNetwork.LocalPlayground}`,
    });
    await expect(initialResponse.statusCode).toStrictEqual(200);
  });
});
