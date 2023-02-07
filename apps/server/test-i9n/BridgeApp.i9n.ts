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
import { PrismaService } from '../src/PrismaService';

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
  contractAddress,
}: {
  startedHardhatContainer: StartedHardhatNetworkContainer;
  contractAddress?: string;
}) {
  return contractAddress
    ? {
        ethereum: {
          rpcUrl: startedHardhatContainer.rpcUrl,
        },
        contract: {
          bridgeProxy: {
            testnetAddress: contractAddress,
          },
        },
      }
    : {
        ethereum: {
          rpcUrl: startedHardhatContainer.rpcUrl,
        },
      };
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

  let prismaService: PrismaService;

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
    const app = await testing.start();

    // init postgres database
    prismaService = app.get<PrismaService>(PrismaService);
    await prismaService.blockNumber.createMany({
      data: [
        {
          blockNumber: 1003,
          network: 'testnet',
        },
        {
          blockNumber: 1000,
          network: 'mainnet',
        },
      ],
    });
  });

  afterAll(async () => {
    await hardhatNetwork.stop();

    // teardown database
    await prismaService.blockNumber.deleteMany({});
  });

  it('Returns an array of confirmed events from a given block number', async () => {
    // Step 1: starting block should be 1003 (after initializations)
    expect(await hardhatNetwork.ethersRpcProvider.getBlockNumber()).toStrictEqual(1003);

    // Step 2: Call addSupportedTokens function and mine the block (block 1004)
    await bridgeUpgradeable
      .connect(defaultAdminSigner)
      .addSupportedTokens(ethers.constants.AddressZero, ethers.utils.parseEther('10'), Math.floor(Date.now() / 1000));
    await hardhatNetwork.generate(1);

    // Step 3: Call bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount) function and mine the block (event emitted at block 1005)
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
    expect(await hardhatNetwork.ethersRpcProvider.getBlockNumber()).toStrictEqual(1005);

    // step 5: calling my service should return a empty array (because it is not confirmed, blockNumber in db remains as 1003)
    let eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(0);
    let dbBlocknumber = await prismaService.blockNumber.findFirst({ where: { network: 'testnet' } });
    expect(dbBlocknumber?.blockNumber).toStrictEqual(1003n);

    // step 6: generate 65 blocks (to simulate confirmation)
    await hardhatNetwork.generate(65);

    // step 7: calling my service should return a array of length 1 (function searches for events emitted from block 1003 to 1005 (1070-65))
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(1);
    dbBlocknumber = await prismaService.blockNumber.findFirst({ where: { network: 'testnet' } });
    expect(dbBlocknumber?.blockNumber).toStrictEqual(1006n);

    // Step 8: Call bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount) a second time and mine it (event emitted at block 1071)
    await bridgeUpgradeable.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      ethers.utils.parseEther('5'),
      {
        value: ethers.utils.parseEther('3'),
      },
    );
    await hardhatNetwork.generate(1);

    // Step 9: generate 30 blocks (current block 1101)
    await hardhatNetwork.generate(30);

    // step 10: current block should be block 1101
    expect(await hardhatNetwork.ethersRpcProvider.getBlockNumber()).toStrictEqual(1101);

    // Step 11: getAllEventsFromBlockNumber should return array of events of length 0 (function searches for events emitted from block 1006 to 1036 (1101-65))
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(0);
    dbBlocknumber = await prismaService.blockNumber.findFirst({ where: { network: 'testnet' } });
    expect(dbBlocknumber?.blockNumber).toStrictEqual(1037n);

    // Step 12: Generate another 35 blocks to achieve confirmation for second event (curr block is 1136)
    await hardhatNetwork.generate(35);

    // Step 13: getAllEventsFromBlockNumber should return array of events of length 1 (function searches for events emitted from block 1037 to 1071 (1136-65))
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(1);
    dbBlocknumber = await prismaService.blockNumber.findFirst({ where: { network: 'testnet' } });
    expect(dbBlocknumber?.blockNumber).toStrictEqual(1072n);

    // Step 14: getAllEventsFromBlockNumber should return array of events of length 0 (function searches for events emitted from block 1072 to 1701 (1101-65), which fails if statement hence blockNumber state will remain the same at 1072)
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(0);
    dbBlocknumber = await prismaService.blockNumber.findFirst({ where: { network: 'testnet' } });
    expect(dbBlocknumber?.blockNumber).toStrictEqual(1072n);
  });

  it('should be able to make calls to the underlying hardhat node', async () => {
    const initialResponse = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });

    await expect(initialResponse.body).toStrictEqual('1136');

    // When one block is mined
    await hardhatNetwork.generate(1);

    // Then the new block height should be +1
    const responseAfterGenerating = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });

    expect(responseAfterGenerating.body).toStrictEqual('1137');
  });
});
