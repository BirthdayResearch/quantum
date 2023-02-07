import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployContracts } from './testUtils/deployment';
import { getCurrentTimeStamp, toWei } from './testUtils/mathUtils';

describe('Test Flushfund functionalities', () => {
  it('Should flush the funds successfully when there is initial redundant funds', async () => {
    const { proxyBridge, flushReceiveSigner } = await loadFixture(deployContracts);
    const ERC20 = await ethers.getContractFactory('TestToken');
    const testToken1 = await ERC20.deploy('Test1', 'T1');
    const testToken2 = await ERC20.deploy('Test2', 'T2');
    const testToken3 = await ERC20.deploy('Test3', 'T3');
    await proxyBridge.addSupportedTokens(testToken1.address, toWei('10'), getCurrentTimeStamp());
    await proxyBridge.addSupportedTokens(testToken2.address, toWei('10'), getCurrentTimeStamp());
    await proxyBridge.addSupportedTokens(testToken3.address, toWei('10'), getCurrentTimeStamp());
    await testToken1.mint(proxyBridge.address, toWei('100'));
    await testToken2.mint(proxyBridge.address, toWei('10'));
    await testToken3.mint(proxyBridge.address, toWei('100'));
    await proxyBridge.flushFund();
    expect(await testToken1.balanceOf(flushReceiveSigner.address)).to.equal(toWei('80'));
    expect(await testToken2.balanceOf(flushReceiveSigner.address)).to.equal(toWei('0'));
    expect(await testToken3.balanceOf(flushReceiveSigner.address)).to.equal(toWei('80'));
  });

  it('Should be able to change flushReceiveAddress', async () => {
    const { proxyBridge, flushReceiveSigner } = await loadFixture(deployContracts);
    const ERC20 = await ethers.getContractFactory('TestToken');
    const testToken1 = await ERC20.deploy('Test1', 'T1');
    await proxyBridge.addSupportedTokens(testToken1.address, toWei('10'), getCurrentTimeStamp());
    await testToken1.mint(proxyBridge.address, toWei('100'));
    await proxyBridge.flushFund();
    expect(await testToken1.balanceOf(flushReceiveSigner.address)).to.equal(toWei('80'));
    const newFlushReceiveAddress = (await ethers.provider.listAccounts())[4];
    await proxyBridge.changeFlushReceiveAddress(newFlushReceiveAddress);
    await testToken1.mint(proxyBridge.address, toWei('100'));
    await proxyBridge.flushFund();
    expect(await testToken1.balanceOf(newFlushReceiveAddress)).to.equal(toWei('100'));
    expect(await testToken1.balanceOf(flushReceiveSigner.address)).to.equal(toWei('80'));
  });

  it('Should be able to change acceptableRemainingDays', async () => {
    const { proxyBridge, flushReceiveSigner } = await loadFixture(deployContracts);
    const ERC20 = await ethers.getContractFactory('TestToken');
    const testToken1 = await ERC20.deploy('Test1', 'T1');
    await proxyBridge.addSupportedTokens(testToken1.address, toWei('10'), getCurrentTimeStamp());
    await testToken1.mint(proxyBridge.address, toWei('100'));
    await proxyBridge.flushFund();
    expect(await testToken1.balanceOf(flushReceiveSigner.address)).to.equal(toWei('80'));
    await proxyBridge.changeAcceptableRemainingDays(4);
    await testToken1.mint(proxyBridge.address, toWei('100'));
    await proxyBridge.flushFund();
    expect(await testToken1.balanceOf(flushReceiveSigner.address)).to.equal(toWei('160'));
  });
});
