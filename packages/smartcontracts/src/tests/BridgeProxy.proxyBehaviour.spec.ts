import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeV2__factory, InitilaizeV1__factory } from '../generated';
import { deployContracts } from './testUtils/deployment';
import { toWei } from './testUtils/mathUtils';

describe('Proxy behaviour', () => {
  const eip712Types = {
    CLAIM: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'tokenAddress', type: 'address' },
    ],
  };

  it('Testing the Proxy Contract claim function', async () => {
    const { proxyBridge, testToken, defaultAdminSigner, operationalAdminSigner, communityAddress } = await loadFixture(
      deployContracts,
    );
    // BridgeV1 should have version 1
    expect(await proxyBridge.version()).to.equal('1');
    // Supporting testToken with hard cap of 15
    await proxyBridge.addSupportedTokens(testToken.address, toWei('15'));
    // Minting 100 testToken to ProxyContract
    await testToken.mint(proxyBridge.address, toWei('100'));
    // ---------------------------Claiming fund on bridge V1-------------------------
    const domainDataV1 = {
      name: 'QUANTUM_BRIDGE',
      version: '1',
      chainId: 1337,
      verifyingContract: proxyBridge.address,
    };
    const eip712DataV1 = {
      to: defaultAdminSigner.address,
      amount: toWei('10'),
      nonce: 0,
      deadline: ethers.constants.MaxUint256,
      tokenAddress: testToken.address,
    };

    const signature = await defaultAdminSigner._signTypedData(domainDataV1, eip712Types, eip712DataV1);
    // Checking Balance before claiming fund, should be 0
    expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(0);
    await proxyBridge.claimFund(
      defaultAdminSigner.address,
      toWei('10'),
      0,
      ethers.constants.MaxUint256,
      testToken.address,
      signature,
    );
    // Checking Balance after claiming fund, should be 10
    expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('10'));
    // ---------------------------END-----Claiming fund on bridge V1-------------------------
    // Encoded BridgeV2 data
    const BridgeUpgradeable = await ethers.getContractFactory('BridgeV2');
    const bridgeUpgradeable = await BridgeUpgradeable.deploy();
    await bridgeUpgradeable.deployed();
    const encodedData = BridgeV2__factory.createInterface().encodeFunctionData('initialize', [
      // admin address
      defaultAdminSigner.address,
      // operational address
      operationalAdminSigner.address,
      // relayer address
      defaultAdminSigner.address,
      // community wallet address
      communityAddress,
      // 0.1%
      10,
      // flushReceiveAddress
      defaultAdminSigner.address,
      // Contract version
      2,
    ]);

    // Upgrading the Proxy contract
    await proxyBridge.upgradeToAndCall(bridgeUpgradeable.address, encodedData);
    const bridgeV2 = await BridgeUpgradeable.attach(proxyBridge.address);
    expect(await bridgeV2.version()).to.equal('2');
    // Deployment tests
    // Check if the accounts[0] has the admin role.
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    expect(await bridgeV2.hasRole(DEFAULT_ADMIN_ROLE, defaultAdminSigner.address)).to.equal(true);
    // Check if the relayer address is same as accounts[0]
    expect(defaultAdminSigner.address).to.be.equal(await bridgeV2.relayerAddress());
    // Check if the accounts[1] has the OPERATIONAL_ROLE.
    const OPERATIONAL_ROLE = ethers.utils.solidityKeccak256(['string'], ['OPERATIONAL_ROLE']);
    expect(await bridgeV2.hasRole(OPERATIONAL_ROLE, operationalAdminSigner.address)).to.equal(true);
    expect(await bridgeV2.communityWallet()).to.equal(communityAddress);
    // Supporting testToken with hard cap of 15
    expect(await bridgeV2.isSupported(testToken.address)).to.equal(true);

    // ---------------------------Claiming fund on bridge V2-------------------------
    const domainDataV2 = {
      name: 'QUANTUM_BRIDGE',
      version: '2',
      chainId: 1337,
      verifyingContract: bridgeV2.address,
    };

    const eip712DataV2 = {
      to: defaultAdminSigner.address,
      amount: toWei('10'),
      nonce: 1,
      deadline: ethers.constants.MaxUint256,
      tokenAddress: testToken.address,
    };

    const signatureV2 = await defaultAdminSigner._signTypedData(domainDataV2, eip712Types, eip712DataV2);
    // Checking Balance before claiming fund, should be 0
    expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('10'));
    await bridgeV2.claimFund(
      defaultAdminSigner.address,
      toWei('10'),
      1,
      ethers.constants.MaxUint256,
      testToken.address,
      signatureV2,
    );
    // Checking Balance after claiming fund, should be 10
    expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('20'));
    // ---------------------------END-----Claiming fund on bridge V2-------------------------
  });

  it('upgrading the Proxy contract with `initializer` modifier', async () => {
    // Upgrading from BridgeV1 contract with `initializer` modifier to `InitilaizeV2` contract with same modifier.
    // Contracts can only go from `initializer` ===> `reinitializer(version)` or `reinitializer(version)` ===> `reinitializer(version)`
    const { proxyBridge, defaultAdminSigner, operationalAdminSigner, communityAddress } = await loadFixture(
      deployContracts,
    );
    expect(await proxyBridge.version()).to.equal('1');
    // Deploying the Contract with `initializer` modifier
    const BridgeUpgradeableInit = await ethers.getContractFactory('InitilaizeV1');
    const bridgeUpgradeableInit = await BridgeUpgradeableInit.deploy();
    await bridgeUpgradeableInit.deployed();
    // deployment arguments for the Proxy contract
    const encodedData = InitilaizeV1__factory.createInterface().encodeFunctionData('initialize', [
      // admin address
      defaultAdminSigner.address,
      // operational address
      operationalAdminSigner.address,
      // relayer address
      defaultAdminSigner.address,
      // community wallet address
      communityAddress,
      // 0.1%
      10,
      // flushReceiveAddress
      defaultAdminSigner.address,
    ]);
    // Init the contract with `initializer` modifier
    await expect(proxyBridge.upgradeToAndCall(bridgeUpgradeableInit.address, encodedData)).to.be.revertedWith(
      'Initializable: contract is already initialized',
    );
  });

  it('should revert when claiming with new contract version', async () => {
    const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
    // Supporting testToken with hard cap of 15
    await proxyBridge.addSupportedTokens(testToken.address, toWei('15'));
    // Minting 100 testToken to ProxyContract
    await testToken.mint(proxyBridge.address, toWei('100'));
    const version = await proxyBridge.version();
    expect(version).to.equal('1');

    // ---------------------------Claiming fund on bridge V1-------------------------
    const domainDataV1 = {
      name: 'QUANTUM_BRIDGE',
      version: '1',
      chainId: 1337,
      verifyingContract: proxyBridge.address,
    };
    const eip712DataV1 = {
      to: defaultAdminSigner.address,
      amount: toWei('10'),
      nonce: 0,
      deadline: ethers.constants.MaxUint256,
      tokenAddress: testToken.address,
    };

    const signature = await defaultAdminSigner._signTypedData(domainDataV1, eip712Types, eip712DataV1);
    // Checking Balance before claiming fund, should be 0
    expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(0);
    await proxyBridge.claimFund(
      defaultAdminSigner.address,
      toWei('10'),
      0,
      ethers.constants.MaxUint256,
      testToken.address,
      signature,
    );
    // Checking Balance after claiming fund, should be 10
    expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('10'));

    // Deploying the Contract with `initializer` modifier via `upgradeTo()`
    const BridgeUpgradeableInit = await ethers.getContractFactory('InitilaizeV1');
    const bridgeUpgradeableInit = await BridgeUpgradeableInit.deploy();
    await bridgeUpgradeableInit.deployed();
    await proxyBridge.upgradeTo(bridgeUpgradeableInit.address);
    const bridgeV2Init = await BridgeUpgradeableInit.attach(proxyBridge.address);
    const version2 = await bridgeV2Init.version();
    expect(version2).to.equal('2');

    // ---------------------------Claiming fund on bridge V2-------------------------
    const domainDataV2 = {
      name: 'QUANTUM_BRIDGE',
      version: version2,
      chainId: 1337,
      verifyingContract: bridgeV2Init.address,
    };
    const eip712DataV2 = {
      to: defaultAdminSigner.address,
      amount: toWei('10'),
      nonce: 1,
      deadline: ethers.constants.MaxUint256,
      tokenAddress: testToken.address,
    };

    const signatureV2 = await defaultAdminSigner._signTypedData(domainDataV2, eip712Types, eip712DataV2);
    // @notice @dev After upgrading to `InitilaizeV1` this contract will have the version 2.
    // When  claiming fund from this contract, below tx revert with custom error `FAKE_SIGNATURE`
    // However, if version set to `1`, this tx execute.
    // Reason behind this could be that constant are part of the code instead of opcodes. Not certain, more investigation needed.

    await expect(
      bridgeV2Init.claimFund(
        defaultAdminSigner.address,
        toWei('10'),
        1,
        ethers.constants.MaxUint256,
        testToken.address,
        signatureV2,
      ),
    ).to.be.revertedWithCustomError(proxyBridge, 'FAKE_SIGNATURE');
    // Checking Balance after claiming fund, should be 10
    expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('10'));
  });
});
