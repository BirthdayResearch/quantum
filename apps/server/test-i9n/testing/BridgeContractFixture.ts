import { BigNumberish, constants, ethers, Signer } from 'ethers';
import {
  BridgeProxy,
  BridgeProxy__factory,
  BridgeV1,
  BridgeV1__factory,
  EvmContractManager,
  HardhatNetwork,
  MockBridgeQueue,
  MockBridgeQueue__factory,
  TestToken,
  TestToken__factory,
} from 'smartcontracts';

export class BridgeContractFixture {
  private contractManager: EvmContractManager;

  // The default signer used to deploy contracts
  public adminAndOperationalSigner: Signer;

  constructor(private readonly hardhatNetwork: HardhatNetwork) {
    this.contractManager = hardhatNetwork.contracts;
    this.adminAndOperationalSigner = hardhatNetwork.contractSigner;
  }

  static readonly Contracts = {
    BridgeImplementation: { deploymentName: 'BridgeV1', contractName: 'BridgeV1' },
    BridgeProxy: { deploymentName: 'BridgeProxy', contractName: 'BridgeProxy' },
    BridgeQueueImplementation: { deploymentName: 'MockBridgeQueue', contractName: 'MockBridgeQueue' },
    BridgeQueueProxy: { deploymentName: 'BridgeQueueProxy', contractName: 'BridgeQueueProxy' },
    MockUSDT: { deploymentName: 'MockUSDT', contractName: 'TestToken' },
    MockUSDC: { deploymentName: 'MockUSDC', contractName: 'TestToken' },
    MockWBTC: { deploymentName: 'MockWBTC', contractName: 'TestToken' },
    MockEUROC: { deploymentName: 'MockEUROC', contractName: 'TestToken' },
    MockDFI: { deploymentName: 'MockDFI', contractName: 'TestToken' },
  };

  get contracts(): BridgeContracts {
    const bridgeProxyContract = this.hardhatNetwork.contracts.getDeployedContract<BridgeProxy>(
      BridgeContractFixture.Contracts.BridgeProxy.deploymentName,
    );
    return {
      // Proxy contract proxies all calls to the implementation contract
      bridgeProxy: BridgeV1__factory.connect(bridgeProxyContract.address, this.adminAndOperationalSigner),
      bridgeImplementation: this.hardhatNetwork.contracts.getDeployedContract<BridgeV1>(
        BridgeContractFixture.Contracts.BridgeImplementation.deploymentName,
      ),
      queueBridgeProxy: MockBridgeQueue__factory.connect(bridgeProxyContract.address, this.adminAndOperationalSigner),
      queueBridgeImplementation: this.hardhatNetwork.contracts.getDeployedContract<MockBridgeQueue>(
        BridgeContractFixture.Contracts.BridgeQueueImplementation.deploymentName,
      ),
      musdt: this.hardhatNetwork.contracts.getDeployedContract<TestToken>(
        BridgeContractFixture.Contracts.MockUSDT.deploymentName,
      ),
      musdc: this.hardhatNetwork.contracts.getDeployedContract<TestToken>(
        BridgeContractFixture.Contracts.MockUSDC.deploymentName,
      ),
      mwbtc: this.hardhatNetwork.contracts.getDeployedContract<TestToken>(
        BridgeContractFixture.Contracts.MockWBTC.deploymentName,
      ),
      meuroc: this.hardhatNetwork.contracts.getDeployedContract<TestToken>(
        BridgeContractFixture.Contracts.MockEUROC.deploymentName,
      ),
      dfi: this.hardhatNetwork.contracts.getDeployedContract<TestToken>(
        BridgeContractFixture.Contracts.MockDFI.deploymentName,
      ),
    };
  }

  getContractsWithSigner(userSigner: Signer): BridgeContracts {
    const bridgeProxyContract = this.hardhatNetwork.contracts.getDeployedContract<BridgeProxy>(
      BridgeContractFixture.Contracts.BridgeProxy.deploymentName,
    );
    return {
      // Proxy contract proxies all calls to the implementation contract
      bridgeProxy: BridgeV1__factory.connect(bridgeProxyContract.address, userSigner),
      bridgeImplementation: this.hardhatNetwork.contracts.getDeployedContract<BridgeV1>(
        BridgeContractFixture.Contracts.BridgeImplementation.deploymentName,
        userSigner,
      ),
      queueBridgeProxy: MockBridgeQueue__factory.connect(bridgeProxyContract.address, userSigner),
      queueBridgeImplementation: this.hardhatNetwork.contracts.getDeployedContract<MockBridgeQueue>(
        BridgeContractFixture.Contracts.BridgeQueueImplementation.deploymentName,
        userSigner,
      ),
      musdt: this.hardhatNetwork.contracts.getDeployedContract<TestToken>(
        BridgeContractFixture.Contracts.MockUSDT.deploymentName,
        userSigner,
      ),
      musdc: this.hardhatNetwork.contracts.getDeployedContract<TestToken>(
        BridgeContractFixture.Contracts.MockUSDC.deploymentName,
        userSigner,
      ),
      mwbtc: this.hardhatNetwork.contracts.getDeployedContract<TestToken>(
        BridgeContractFixture.Contracts.MockWBTC.deploymentName,
        userSigner,
      ),
      meuroc: this.hardhatNetwork.contracts.getDeployedContract<TestToken>(
        BridgeContractFixture.Contracts.MockEUROC.deploymentName,
        userSigner,
      ),
      dfi: this.hardhatNetwork.contracts.getDeployedContract<TestToken>(
        BridgeContractFixture.Contracts.MockDFI.deploymentName,
        userSigner,
      ),
    };
  }

  get contractsWithAdminAndOperationalSigner(): BridgeContracts {
    return this.getContractsWithSigner(this.adminAndOperationalSigner);
  }

  /**
   * Deploys the contracts, using the Signer of the HardhatContainer as the operational and admin address
   */
  async deployContracts(): Promise<BridgeContracts> {
    const { bridgeV1: bridgeUpgradeable, data: encodedData } = await this.deployBridgeProxy();

    // Deploying proxy contract
    const bridgeProxy = await this.contractManager.deployContract<BridgeProxy>({
      deploymentName: BridgeContractFixture.Contracts.BridgeProxy.deploymentName,
      contractName: BridgeContractFixture.Contracts.BridgeProxy.contractName,
      deployArgs: [bridgeUpgradeable.address, encodedData],
      abi: BridgeProxy__factory.abi,
    });
    await this.hardhatNetwork.generate(1);
    const { queueBridge: queueBridgeUpgradeable, data: queueEncodedData } = await this.deployQueueBridgeProxy();

    // Deploying proxy contract
    const queueBridgeProxy = await this.contractManager.deployContract<BridgeProxy>({
      deploymentName: BridgeContractFixture.Contracts.BridgeQueueProxy.deploymentName,
      contractName: BridgeContractFixture.Contracts.BridgeQueueProxy.deploymentName,
      deployArgs: [queueBridgeUpgradeable.address, queueEncodedData],
      abi: BridgeProxy__factory.abi,
    });
    await this.hardhatNetwork.generate(1);

    // Deploy MockUSDT
    const musdt = await this.contractManager.deployContract<TestToken>({
      deploymentName: BridgeContractFixture.Contracts.MockUSDT.deploymentName,
      contractName: BridgeContractFixture.Contracts.MockUSDT.contractName,
      deployArgs: ['MockUSDT', 'MUSDT'],
      abi: TestToken__factory.abi,
    });

    // Deploy MockUSDC
    const musdc = await this.contractManager.deployContract<TestToken>({
      deploymentName: BridgeContractFixture.Contracts.MockUSDC.deploymentName,
      contractName: BridgeContractFixture.Contracts.MockUSDC.contractName,
      deployArgs: ['MockUSDC', 'MUSDC'],
      abi: TestToken__factory.abi,
    });

    // Deploy MockWBTC
    const mwbtc = await this.contractManager.deployContract<TestToken>({
      deploymentName: BridgeContractFixture.Contracts.MockWBTC.deploymentName,
      contractName: BridgeContractFixture.Contracts.MockWBTC.contractName,
      deployArgs: ['MockWBTC', 'MWBTC'],
      abi: TestToken__factory.abi,
    });

    // Deploy MockEUROC
    const meuroc = await this.contractManager.deployContract<TestToken>({
      deploymentName: BridgeContractFixture.Contracts.MockEUROC.deploymentName,
      contractName: BridgeContractFixture.Contracts.MockEUROC.contractName,
      deployArgs: ['MockWEUROC', 'MEURC'],
      abi: TestToken__factory.abi,
    });

    // Deploy MockDFI
    const dfi = await this.contractManager.deployContract<TestToken>({
      deploymentName: BridgeContractFixture.Contracts.MockDFI.deploymentName,
      contractName: BridgeContractFixture.Contracts.MockDFI.contractName,
      deployArgs: ['MockDFI', 'DFI'],
      abi: TestToken__factory.abi,
    });

    await this.hardhatNetwork.generate(1);

    // Create a reference to the implementation contract via proxy
    const bridge = BridgeV1__factory.connect(bridgeProxy.address, this.adminAndOperationalSigner);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const queueBridge = MockBridgeQueue__factory.connect(queueBridgeProxy.address, this.adminAndOperationalSigner);

    // Adding MUSDT, MUSDC, MWBTC, EUROC and ETH as supported tokens
    await bridge.addSupportedTokens(musdt.address, constants.MaxInt256);
    await bridge.addSupportedTokens(musdc.address, constants.MaxInt256);
    await bridge.addSupportedTokens(mwbtc.address, constants.MaxInt256);
    await bridge.addSupportedTokens(meuroc.address, constants.MaxInt256);
    await bridge.addSupportedTokens(dfi.address, constants.MaxInt256);
    await bridge.addSupportedTokens(ethers.constants.AddressZero, constants.MaxInt256);

    await queueBridge.addSupportedToken(musdt.address);
    await queueBridge.addSupportedToken(musdc.address);
    await queueBridge.addSupportedToken(mwbtc.address);
    await queueBridge.addSupportedToken(meuroc.address);
    await queueBridge.addSupportedToken(dfi.address);
    await queueBridge.addSupportedToken(ethers.constants.AddressZero);

    await this.hardhatNetwork.generate(1);

    return this.contracts;
  }

  /**
   * Mints MUSDC, MUSDT, MWBTC And MEURC tokens to an EOA
   */
  async mintTokensToEOA(address: string, amount: BigNumberish = constants.MaxInt256): Promise<void> {
    const { musdc, musdt, mwbtc, meuroc, dfi } = this.getContractsWithSigner(this.adminAndOperationalSigner);
    await musdc.mint(address, amount);
    await musdt.mint(address, amount);
    await mwbtc.mint(address, amount);
    await meuroc.mint(address, amount);
    await dfi.mint(address, amount);

    await this.hardhatNetwork.generate(1);
  }

  async deployBridgeProxy(): Promise<{ bridgeV1: BridgeV1; data: string }> {
    // Deploying BridgeV1 implementation contract
    const bridgeUpgradeable = await this.contractManager.deployContract<BridgeV1>({
      deploymentName: BridgeContractFixture.Contracts.BridgeImplementation.deploymentName,
      contractName: BridgeContractFixture.Contracts.BridgeImplementation.contractName,
      abi: BridgeV1__factory.abi,
    });
    await this.hardhatNetwork.generate(1);

    const adminAndOperationalAddress = await this.adminAndOperationalSigner.getAddress();

    // Deployment arguments for the Proxy contract
    const encodedData = BridgeV1__factory.createInterface().encodeFunctionData('initialize', [
      // admin address
      adminAndOperationalAddress,
      // operational address
      adminAndOperationalAddress,
      // relayer address
      // TODO: change this to the actual relayer address
      adminAndOperationalAddress,
      // community address
      // TODO: change this to the actual community address
      adminAndOperationalAddress,
      // 0.3% txn fee
      30,
      // flush funds back to admin and operational signer
      // TODO: change this to the actual flush address
      adminAndOperationalAddress,
    ]);
    return { bridgeV1: bridgeUpgradeable, data: encodedData };
  }

  async deployQueueBridgeProxy(): Promise<{ queueBridge: MockBridgeQueue; data: string }> {
    // Deploying MockBridgeQueue implementation contract
    const bridgeUpgradeable = await this.contractManager.deployContract<MockBridgeQueue>({
      deploymentName: BridgeContractFixture.Contracts.BridgeQueueImplementation.deploymentName,
      contractName: BridgeContractFixture.Contracts.BridgeQueueImplementation.contractName,
      abi: MockBridgeQueue__factory.abi,
    });
    await this.hardhatNetwork.generate(1);

    const adminAndOperationalAddress = await this.adminAndOperationalSigner.getAddress();

    // Deployment arguments for the Proxy contract
    const encodedData = MockBridgeQueue__factory.createInterface().encodeFunctionData('initialize', [
      // admin address
      adminAndOperationalAddress,
      // cold wallet address
      adminAndOperationalAddress,
      // 0.3% txn fee
      30,
      // Community address
      adminAndOperationalAddress,
    ]);
    return { queueBridge: bridgeUpgradeable, data: encodedData };
  }

  /**
   * Approves the bridge contract to spend MUSDC and MUSDT and MWBTC tokens.
   *
   * This approves the maximum possible amount.
   * @param signer
   */
  async approveBridgeForEOA(signer: Signer): Promise<void> {
    const { musdc, musdt, mwbtc, meuroc, dfi } = this.getContractsWithSigner(signer);
    const { bridgeProxy } = this.contracts;

    await musdc.approve(bridgeProxy.address, constants.MaxInt256);
    await musdt.approve(bridgeProxy.address, constants.MaxInt256);
    await mwbtc.approve(bridgeProxy.address, constants.MaxInt256);
    await meuroc.approve(bridgeProxy.address, constants.MaxInt256);
    await dfi.approve(bridgeProxy.address, constants.MaxInt256);

    await this.hardhatNetwork.generate(1);
  }

  /**
   * A convenience function that
   * - Deploys the bridge contracts, with MUSDCT and MUSDT as supported tokens
   * - Mints MUSDC and MUSDT tokens to the admin and operational signer of the bridge
   * - Approves the bridge contract to spend MUSDC and MUSDT tokens on behalf of the above signer
   *
   * When using this function, the signer of the HardhatContainer will be the admin and operational signer of the bridge.
   */
  async setup(): Promise<void> {
    await this.deployContracts();
    await this.mintTokensToEOA(await this.adminAndOperationalSigner.getAddress());
    await this.approveBridgeForEOA(await this.adminAndOperationalSigner);
  }
}

export interface BridgeContracts {
  bridgeProxy: BridgeV1;
  bridgeImplementation: BridgeV1;
  queueBridgeProxy: MockBridgeQueue;
  queueBridgeImplementation: MockBridgeQueue;
  musdt: TestToken;
  musdc: TestToken;
  mwbtc: TestToken;
  meuroc: TestToken;
  dfi: TestToken;
}
