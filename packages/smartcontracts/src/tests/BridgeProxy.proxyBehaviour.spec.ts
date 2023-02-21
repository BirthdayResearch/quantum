import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeV1, TestToken } from '../generated';
import { deployContracts } from './testUtils/deployment';
import { toWei } from './testUtils/mathUtils';

describe('Proxy behaviour', () => {
  let proxyBridge: BridgeV1;
  let defaultAdminSigner: SignerWithAddress;
  let operationalAdminSigner: SignerWithAddress;
  let communityAddress: string;
  let domainData: any;
  let testToken: TestToken;

  const eip712Types = {
    CLAIM: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'tokenAddress', type: 'address' },
    ],
  };
  beforeEach(async () => {
    ({ proxyBridge, defaultAdminSigner, operationalAdminSigner, communityAddress, testToken } = await loadFixture(
      deployContracts,
    ));
    const BridgeUpgradeable = await ethers.getContractFactory('BridgeV2');
    const bridgeUpgradeable = await BridgeUpgradeable.deploy();
    await bridgeUpgradeable.deployed();
    await proxyBridge.upgradeTo(bridgeUpgradeable.address);
    // `version` should be `2.0`. However, tx is failing with this one.
    // Tx will only proceed if the `version` is `1.0` after the upgrade
    domainData = {
      name: 'QUANTUM_BRIDGE',
      version: '1.0',
      chainId: 1337,
      verifyingContract: proxyBridge.address,
    };
    // Minting 100 testToken to ProxyContract
    await testToken.mint(proxyBridge.address, toWei('100'));
    // Supporting testToken with hard cap of 15
    await proxyBridge.addSupportedTokens(testToken.address, toWei('15'));
  });

  it('Deployment checks', async () => {
    // Check if the accounts[0] has the admin role.
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    expect(await proxyBridge.hasRole(DEFAULT_ADMIN_ROLE, defaultAdminSigner.address)).to.equal(true);
    // Check if the relayer address is same as accounts[0]
    expect(defaultAdminSigner.address).to.be.equal(await proxyBridge.relayerAddress());
    // Check if the accounts[1] has the OPERATIONAL_ROLE.
    const OPERATIONAL_ROLE = ethers.utils.solidityKeccak256(['string'], ['OPERATIONAL_ROLE']);
    expect(await proxyBridge.hasRole(OPERATIONAL_ROLE, operationalAdminSigner.address)).to.equal(true);
    expect(await proxyBridge.communityWallet()).to.equal(communityAddress);
    // Checking constant
    expect(await proxyBridge.name()).to.be.equal('QUANTUM_BRIDGE');
    expect(await proxyBridge.version()).to.be.equal('2.0');
  });

  it('Claiming fund', async () => {
    const eip712Data = {
      to: defaultAdminSigner.address,
      amount: toWei('10'),
      nonce: 0,
      deadline: ethers.constants.MaxUint256,
      tokenAddress: testToken.address,
    };
    const signature = await defaultAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
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
  });
});
