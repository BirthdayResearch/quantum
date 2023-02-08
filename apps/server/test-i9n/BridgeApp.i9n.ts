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
  });

  afterAll(async () => {
    await hardhatNetwork.stop();

    // teardown database
    await prismaService.bridgeEventTransactions.deleteMany({});
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
    const transactionCall = await bridgeUpgradeable.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      ethers.utils.parseEther('5'),
      {
        value: ethers.utils.parseEther('3'),
      },
    );
    await hardhatNetwork.generate(1);

    // Step 4: db should not have record of transaction
    let transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord).toStrictEqual(null);

    let txReceipt = await testing.inject({
      method: 'GET',
      url: `/app/checkTransactionConfirmationStatus?transactionHash=${transactionCall.hash}`,
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual(false);

    // Step 5: db should create a record of transaction with status='NOT_CONFIRMED', as number of confirmations = 0.
    transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual('NOT_CONFIRMED');

    // Step 6: mine 65 blocks to make the transaction confirmed
    await hardhatNetwork.generate(65);

    // Step 7: service should update record in db with status='CONFIRMED', as number of confirmations now hit 65.
    txReceipt = await testing.inject({
      method: 'GET',
      url: `/app/checkTransactionConfirmationStatus?transactionHash=${transactionCall.hash}`,
    });
    expect(JSON.parse(txReceipt.body)).toStrictEqual(true);

    transactionDbRecord = await prismaService.bridgeEventTransactions.findFirst({
      where: { transactionHash: transactionCall.hash },
    });
    expect(transactionDbRecord?.status).toStrictEqual('CONFIRMED');
  });
});
