import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ethers } from 'ethers';
import {
  BridgeProxy,
  BridgeProxy__factory,
  BridgeV1,
  BridgeV1__factory,
  EvmContractManager,
  HardhatNetwork,
  HardhatNetworkContainer,
  StartedHardhatNetworkContainer,
} from 'smartcontracts';

import { AppConfig } from '../src/AppConfig';
import { AppModule } from '../src/AppModule';
import { BridgeServerTestingApp } from '../src/BridgeServerTestingApp';
import {EnvironmentNetwork} from "@waveshq/walletkit-core";

@Module({})
export class TestingExampleModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: TestingExampleModule,
      imports: [AppModule, ConfigModule.forFeature(() => config)],
    };
  }
}

export function buildTestConfig({
  startedHardhatContainer,
  contractAddress, localWhaleURL, localDefichainKey
}: {
  startedHardhatContainer?: StartedHardhatNetworkContainer;
  contractAddress?: string;
  localWhaleURL?: string;
  localDefichainKey?: string;
}) {
  const config = {
    ethereum: {
      rpcUrl: startedHardhatContainer?.rpcUrl ?? 'localhost:8545',
    },
    defichain: {
      localWhaleURL,
      [EnvironmentNetwork.LocalPlayground]: localDefichainKey
    }
  }
  return contractAddress
    ? {
        ...config,
        contract: {
          bridgeProxy: {
            testnetAddress: contractAddress,
          },
        },
      }
    : config;
}

describe('Bridge Service Integration Tests', () => {
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let evmContractManager: EvmContractManager;
  let defaultAdminAddress: string;
  let defaultAdminSigner: ethers.Signer;
  let operationalAdminAddress: string;
  let bridgeUpgradeable: BridgeV1;
  let bridgeProxy: BridgeProxy;
  let testing: BridgeServerTestingApp;

  beforeAll(async () => {
    startedHardhatContainer = await new HardhatNetworkContainer().start();
    hardhatNetwork = await startedHardhatContainer.ready();

    evmContractManager = hardhatNetwork.contracts;
    // Default and operational admin account
    ({ testWalletAddress: defaultAdminAddress, testWalletSigner: defaultAdminSigner } =
      await hardhatNetwork.createTestWallet());
    ({ testWalletAddress: operationalAdminAddress } = await hardhatNetwork.createTestWallet());

    // Deploying BridgeV1 contract
    bridgeUpgradeable = await evmContractManager.deployContract<BridgeV1>({
      deploymentName: 'BridgeV1',
      contractName: 'BridgeV1',
      abi: BridgeV1__factory.abi,
    });
    await hardhatNetwork.generate(1);

    // Deployment arguments for the Proxy contract
    const encodedData = BridgeV1__factory.createInterface().encodeFunctionData('initialize', [
      'CAKE_BRIDGE',
      '0.1',
      defaultAdminAddress,
      operationalAdminAddress,
      defaultAdminAddress,
      30, // 0.3% txn fee
    ]);

    // Deploying proxy contract
    bridgeProxy = await evmContractManager.deployContract<BridgeProxy>({
      deploymentName: 'BridgeProxy',
      contractName: 'BridgeProxy',
      deployArgs: [bridgeUpgradeable.address, encodedData],
      abi: BridgeProxy__factory.abi,
    });
    await hardhatNetwork.generate(1);

    // Attach proxy address to bridgeUpgradeable contract
    bridgeUpgradeable = bridgeUpgradeable.attach(bridgeProxy.address);
    await hardhatNetwork.generate(1);

    // initialize config variables
    testing = new BridgeServerTestingApp(
      TestingExampleModule.register(
        buildTestConfig({ startedHardhatContainer, contractAddress: bridgeUpgradeable.address }),
      ),
    );
    await testing.start();
  });

  afterAll(async () => {
    await hardhatNetwork.stop();
  });

  it('Returns an array of confirmed events from a given block number', async () => {
    // Step 1: starting block should be 1003 (after initializations)
    let currBlock = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });
    await expect(currBlock.body).toStrictEqual('1003');

    // Step 2: Call addSupportedTokens function and mine the block (block 1004)
    await bridgeUpgradeable
      .connect(defaultAdminSigner)
      .addSupportedTokens(ethers.constants.AddressZero, ethers.utils.parseEther('10'), Math.floor(Date.now() / 1000));
    await hardhatNetwork.generate(1);

    // Step 3: Call bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount) function and mine the block (block 1005)
    await bridgeUpgradeable.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      ethers.utils.parseEther('5'),
      {
        value: ethers.utils.parseEther('3'),
      },
    );
    await hardhatNetwork.generate(1);

    // step 4: currBlock should now be 1005
    currBlock = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });
    await expect(currBlock.body).toStrictEqual('1005');

    // step 5: calling my service should return a empty array (because it is not confirmed)
    let eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=1005`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(0);

    // step 6: generate 65 blocks (to simulate confirmation)
    await hardhatNetwork.generate(65);

    // step 7: calling my service should return a array of length 1
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=1005`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(1);

    // Step 8: Call bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount) a second time and mine it (block 1071)
    await bridgeUpgradeable.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      ethers.utils.parseEther('5'),
      {
        value: ethers.utils.parseEther('3'),
      },
    );
    await hardhatNetwork.generate(1);

    // Step 10: generate 30 blocks (block 1101)
    await hardhatNetwork.generate(30);

    // step 11: current block should be block 1101
    currBlock = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });
    await expect(currBlock.body).toStrictEqual('1101');

    // Step 12: getAllEventsFromBlockNumber where blockNumber=1005 should return array of events of length 1
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=1005`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(1);

    // Step 13: Generate another 35 blocks to achieve confirmation for second event
    await hardhatNetwork.generate(35);

    // Step 14: getAllEventsFromBlockNumber where blockNumber=1005 should return array of events of length 2 now
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=1005`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(2);

    // Step 15: getAllEventsFromBlockNumber where blockNumber=1071 should return array of events of length 1
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=1071`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(1);

    // Step 16: getAllEventsFromBlockNumber where blockNumber=1072 should return array of events of length 0
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=1072`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(0);
  });

  it('should be able to make calls to the underlying hardhat node', async () => {
    // Given an initial block height of 1136 (due to the initial block generation when calling HardhatNetwork.ready() + getAllEventsFromBlockNumber tests)
    const initialResponse = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });

    await expect(initialResponse.body).toStrictEqual('1136');

    // When one block is mined
    await hardhatNetwork.generate(1);

    // Then the new block height should be 1
    const responseAfterGenerating = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });

    expect(responseAfterGenerating.body).toStrictEqual('1137');
  });
});
