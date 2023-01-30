import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
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

import { AppModule } from '../src/AppModule';
import { BridgeServerTestingApp } from '../src/BridgeServerTestingApp';

@Module({})
export class TestingExampleModule {
  static register(startedHardhatContainer: StartedHardhatNetworkContainer): DynamicModule {
    const hardhatConfig = registerAs('ethereum', () => ({
      rpcUrl: startedHardhatContainer.rpcUrl,
    }));

    return {
      module: TestingExampleModule,
      imports: [AppModule, ConfigModule.forFeature(hardhatConfig)],
    };
  }
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

    testing = new BridgeServerTestingApp(TestingExampleModule.register(startedHardhatContainer));
    await testing.start();
  });

  afterAll(async () => {
    await hardhatNetwork.stop();
  });

  describe('Proxy contract deployment', () => {
    it("Contract code should not be equal to '0x'", async () => {
      await expect(hardhatNetwork.ethersRpcProvider.getCode(bridgeUpgradeable.address)).resolves.not.toStrictEqual(
        '0x',
      );
    });
    it('Admin address should be Default Admin address', async () => {
      const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
      expect(await bridgeUpgradeable.hasRole(DEFAULT_ADMIN_ROLE, defaultAdminAddress)).toBe(true);
    });
    it('Operational address should be Operational Admin address', async () => {
      const OPERATIONAL_ROLE = ethers.utils.solidityKeccak256(['string'], ['OPERATIONAL_ROLE']);
      expect(await bridgeUpgradeable.hasRole(OPERATIONAL_ROLE, operationalAdminAddress)).toBe(true);
    });
    it('Relayer address should be Default Admin address', async () => {
      expect(await bridgeUpgradeable.relayerAddress()).toBe(defaultAdminAddress);
    });
    it('Successfully implemented the 0.3% txn fee', async () => {
      expect((await bridgeUpgradeable.transactionFee()).toString()).toBe('30');
    });
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
    const payload = {
      blockNumber: 1000,
      contractAddress: bridgeUpgradeable.address,
    };
    let eventsArray = await testing.inject({
      method: 'POST',
      url: `/app/getAllEventsFromBlockNumber`,
      payload,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(0);

    // step 6: generate 65 blocks (to simulate confirmation)
    await hardhatNetwork.generate(65);

    // step 7: calling my service should return a array of length 1
    eventsArray = await testing.inject({
      method: 'POST',
      url: `/app/getAllEventsFromBlockNumber`,
      payload,
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

    // Step 12: getAllEventsFromBlockNumber?blockNumber=1005 should return array of events of length 1
    eventsArray = await testing.inject({
      method: 'POST',
      url: `/app/getAllEventsFromBlockNumber`,
      payload: {
        blockNumber: 1005,
        contractAddress: bridgeUpgradeable.address,
      },
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(1);

    // Step 13: Generate another 35 blocks to achieve confirmation for second event
    await hardhatNetwork.generate(35);

    // Step 14: getAllEventsFromBlockNumber?blockNumber=1005 should return array of events of length 2 now
    eventsArray = await testing.inject({
      method: 'POST',
      url: `/app/getAllEventsFromBlockNumber`,
      payload: {
        blockNumber: 1005,
        contractAddress: bridgeUpgradeable.address,
      },
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(2);

    // Step 15: getAllEventsFromBlockNumber?blockNumber=1071 should return array of events of length 1
    eventsArray = await testing.inject({
      method: 'POST',
      url: `/app/getAllEventsFromBlockNumber`,
      payload: {
        blockNumber: 1071,
        contractAddress: bridgeUpgradeable.address,
      },
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(1);

    // Step 16: getAllEventsFromBlockNumber?blockNumber=1072 should return array of events of length 0
    eventsArray = await testing.inject({
      method: 'POST',
      url: `/app/getAllEventsFromBlockNumber`,
      payload: {
        blockNumber: 1072,
        contractAddress: bridgeUpgradeable.address,
      },
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(0);
  });

  it('should be able to make calls to the underlying hardhat node', async () => {
    // Given an initial block height of 1136 (due to the initial block generation when calling HardhatNetwork.ready())
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
