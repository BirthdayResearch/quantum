import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { TestBridge, TestBridge__factory, TestToken } from '../generated';
import { toWei } from './testUtils/mathUtils';

describe('EVM to Defi Bridge V2', () => {
  let proxyBridge: TestBridge;
  let defaultAdminSigner: SignerWithAddress;
  let operationalAdminSigner: SignerWithAddress;
  let testToken: TestToken;

  beforeEach(async () => {
    const accounts = await ethers.provider.listAccounts();
    defaultAdminSigner = await ethers.getSigner(accounts[0]);
    operationalAdminSigner = await ethers.getSigner(accounts[1]);
    const BridgeUpgradeable = await ethers.getContractFactory('TestBridge');
    const bridgeUpgradeable = await BridgeUpgradeable.deploy();
    await bridgeUpgradeable.deployed();
    const BridgeProxy = await ethers.getContractFactory('BridgeProxy');
    // deployment arguments for the Proxy contract
    const encodedData = TestBridge__factory.createInterface().encodeFunctionData('initialize', [
      // admin address
      accounts[0],
      // operational address
      accounts[1],
      // relayer address
      accounts[0],
      // community wallet address
      accounts[4],
      30,
      // flushReceiveAddress
      accounts[3],
      // minimum days of allowance for the bridge to be operational
      2,
    ]);
    const bridgeProxy = await BridgeProxy.deploy(bridgeUpgradeable.address, encodedData);
    await bridgeProxy.deployed();
    proxyBridge = BridgeUpgradeable.attach(bridgeProxy.address);
    // Deploying ERC20 tokens
    const ERC20 = await ethers.getContractFactory('TestToken');
    testToken = await ERC20.deploy('Test', 'T');
    await testToken.deployed();
  });

  it('Sanity check', async () => {
    // Check if the accounts[0] has the admin role.
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    expect(await proxyBridge.hasRole(DEFAULT_ADMIN_ROLE, defaultAdminSigner.address)).to.equal(true);
    // Check if the relayer address is same as accounts[0]
    expect(defaultAdminSigner.address).to.be.equal(await proxyBridge.relayerAddress());
    // Check if the accounts[1] has the OPERATIONAL_ROLE.
    const OPERATIONAL_ROLE = ethers.utils.solidityKeccak256(['string'], ['OPERATIONAL_ROLE']);
    expect(await proxyBridge.hasRole(OPERATIONAL_ROLE, operationalAdminSigner.address)).to.equal(true);
  });
  it('Testing allowance for the day', async () => {
    // Added supported tokens
    await proxyBridge.addSupportedTokens(testToken.address, toWei('10'), (await time.latest()) + 10);
    // Minting and approving
    // Test token
    await testToken.mint(defaultAdminSigner.address, toWei('100'));
    await testToken.approve(proxyBridge.address, ethers.constants.MaxUint256);
    // `dailyAllowance` for Test token should be 10
    expect(await (await proxyBridge.tokenAllowances(testToken.address)).dailyAllowance).to.be.equal(toWei('10'));
    // `currentDailyUsage` for Test token should be zero
    expect(await (await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.be.equal(toWei('0'));
    // Increasing time by 60 secs
    await time.increase(60);
    // Bridging 10 test tokens
    await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10'));
    // This tx should revert with the custom error 'EXCEEDS_DAILY_ALLOWANCE'
    await expect(
      proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10')),
    ).to.be.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
    // After bridging 10 Test tokens, `currentDailyUsage` should be 10 for the hour
    expect(await (await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.be.equal(toWei('10'));
    // Increasing time by 1 hr
    await time.increase(60 * 60 * 1);
    // Bridging 5 test tokens
    await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('5'));
    // `currentDailyUsage` should be 5. Users can still bridge 5 more Test tokens
    expect(await (await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.be.equal(toWei('5'));
    // Bridging 5 test tokens
    await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('5'));
    // After bridging 10 Test tokens, `currentDailyUsage` should be 10.
    expect(await (await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.be.equal(toWei('10'));
    // Increasing time by 2 hrs
    await time.increase(60 * 60 * 2);
    // This tx should revert with the custom error 'EXCEEDS_DAILY_ALLOWANCE'. Bridging more than 10 test tokens
    await expect(
      proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('11')),
    ).to.be.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
    // Bridging 10 Test tokens
    await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10'));
    // `currentDailyUsage` should be 10.
    expect(await (await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.be.equal(toWei('10'));
  });
});
