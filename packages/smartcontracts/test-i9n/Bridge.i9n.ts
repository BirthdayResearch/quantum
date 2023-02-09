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
} from '../src';

describe('Bridge Contract', () => {
  const container = new HardhatNetworkContainer();
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let evmContractManager: EvmContractManager;
  let defaultAdminAddress: string;
  let operationalAdminAddress: string;
  let bridgeUpgradeable: BridgeV1;
  let bridgeProxy: BridgeProxy;

  beforeAll(async () => {
    startedHardhatContainer = await container.start();
    hardhatNetwork = await startedHardhatContainer.ready();
    evmContractManager = hardhatNetwork.contracts;
    // Default and operational admin account
    ({ testWalletAddress: defaultAdminAddress } = await hardhatNetwork.createTestWallet());
    ({ testWalletAddress: operationalAdminAddress } = await hardhatNetwork.createTestWallet());
    // Deploying BridgeV1 contract
    bridgeUpgradeable = await evmContractManager.deployContract<BridgeV1>({
      deploymentName: 'BridgeV1',
      contractName: 'BridgeV1',
      abi: BridgeV1__factory.abi,
    });
    await hardhatNetwork.generate(1);
    // deployment arguments for the Proxy contract
    const encodedData = BridgeV1__factory.createInterface().encodeFunctionData('initialize', [
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
    bridgeUpgradeable = bridgeUpgradeable.attach(bridgeProxy.address);
    await hardhatNetwork.generate(1);
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
});
