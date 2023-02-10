import { loadFixture, mine, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';

import { deployContracts } from './testUtils/deployment';
import { toWei } from './testUtils/mathUtils';

const ONE_DAY = 60 * 60 * 24;
describe('Test Flushfund functionalities', () => {
  it('Should flush the funds successfully when there is initial redundant funds', async () => {
    const { proxyBridge, testToken, testToken2, flushReceiveSigner } = await loadFixture(deployContracts);
    const ERC20 = await ethers.getContractFactory('TestToken');
    const testToken3 = await ERC20.deploy('Test3', 'T3');
    // there seems to be a mismatch between the concept of time in nodejs and the time of the blockchain, so I use time.latest() over here
    // when the transaction is included in the block, await time.latest() + 60 will give the value of block.timestamp + 59
    await proxyBridge.addSupportedTokens(testToken.address, toWei('10'), (await time.latest()) + 60);
    await proxyBridge.addSupportedTokens(testToken2.address, toWei('10'), (await time.latest()) + 60);
    await proxyBridge.addSupportedTokens(testToken3.address, toWei('10'), (await time.latest()) + 60);
    await testToken.mint(proxyBridge.address, toWei('100'));
    await testToken2.mint(proxyBridge.address, toWei('10'));
    await testToken3.mint(proxyBridge.address, toWei('100'));
    // increase time by 60 secs
    await time.increase(60);
    const balance1BeforeFlush = await testToken.balanceOf(flushReceiveSigner.address);
    const balance2BeforeFlush = await testToken2.balanceOf(flushReceiveSigner.address);
    const balance3BeforeFlush = await testToken3.balanceOf(flushReceiveSigner.address);
    await proxyBridge.flushFund();
    const balance1AfterFlush = await testToken.balanceOf(flushReceiveSigner.address);
    const balance2AfterFlush = await testToken2.balanceOf(flushReceiveSigner.address);
    const balance3AfterFlush = await testToken3.balanceOf(flushReceiveSigner.address);
    expect(balance1AfterFlush.sub(balance1BeforeFlush)).to.equal(toWei('80'));
    expect(balance2AfterFlush.sub(balance2BeforeFlush)).to.equal(toWei('0'));
    expect(balance3AfterFlush.sub(balance3BeforeFlush)).to.equal(toWei('80'));
  });

  it('Should be able to change flushReceiveAddress', async () => {
    const { proxyBridge, flushReceiveSigner, testToken } = await loadFixture(deployContracts);

    // Use the time before adding the token as the reference time
    const referenceTime = await time.latest(); // X

    await proxyBridge.addSupportedTokens(testToken.address, toWei('10'), referenceTime + 60); // + 1
    expect((await proxyBridge.tokenAllowances(testToken.address)).latestResetTimestamp).to.equal(referenceTime + 60);
    await testToken.mint(proxyBridge.address, toWei('100')); // + 1

    // await time.increase(60); // + 60

    await network.provider.request({
      method: 'evm_setNextBlockTimestamp',
      params: [toHexString(referenceTime + 60 + 1 + 1)],
    });
    await mine(1);

    const balance1stReceiverBefore1stFlush = await testToken.balanceOf(flushReceiveSigner.address);
    await proxyBridge.flushFund();
    const balance1stReceiverAfter1stFlush = await testToken.balanceOf(flushReceiveSigner.address);
    expect(balance1stReceiverAfter1stFlush.sub(balance1stReceiverBefore1stFlush)).to.equal(toWei('80'));
    const newFlushReceiveAddress = (await ethers.provider.listAccounts())[4];
    await proxyBridge.changeFlushReceiveAddress(newFlushReceiveAddress);
    await testToken.mint(proxyBridge.address, toWei('100'));
    const balance1stReceiverBefore2ndFlush = await testToken.balanceOf(flushReceiveSigner.address);
    const balance2ndReceiverBefore2ndFlush = await testToken.balanceOf(newFlushReceiveAddress);
    await proxyBridge.flushFund();
    const balance1stReceiverAfter2ndFlush = await testToken.balanceOf(flushReceiveSigner.address);
    const balance2ndReceiverAfter2ndFlush = await testToken.balanceOf(newFlushReceiveAddress);
    expect(balance1stReceiverAfter2ndFlush).to.equal(balance1stReceiverBefore2ndFlush);
    expect(balance2ndReceiverAfter2ndFlush).to.equal(balance2ndReceiverBefore2ndFlush.add(toWei('100')));
  });

  it('Should be able to change acceptableRemainingDays', async () => {
    const { proxyBridge, flushReceiveSigner, testToken } = await loadFixture(deployContracts);
    // latestResetTimestamp = block.timestamp + 59 = X + 59
    await proxyBridge.addSupportedTokens(testToken.address, toWei('10'), (await time.latest()) + 60);
    // block.timestamp = X + 1
    await testToken.mint(proxyBridge.address, toWei('100'));
    // increase time by 60 secs
    // block.timestamp = X + 61
    await time.increase(60);
    // block.timstamp = X + 62 > X + 59 = latestResetTimestamp --> flush
    const balanceBefore1stFlush = await testToken.balanceOf(flushReceiveSigner.address);
    await proxyBridge.flushFund();
    const balanceAfter1stFlush = await testToken.balanceOf(flushReceiveSigner.address);
    expect(balanceAfter1stFlush).to.equal(balanceBefore1stFlush.add(toWei('80')));
    await proxyBridge.changeAcceptableRemainingDays(4);
    await testToken.mint(proxyBridge.address, toWei('100'));
    const balanceBefore2ndFlush = await testToken.balanceOf(flushReceiveSigner.address);
    await proxyBridge.flushFund();
    const balanceAfter2ndFlush = await testToken.balanceOf(flushReceiveSigner.address);
    expect(balanceAfter2ndFlush).to.equal(balanceBefore2ndFlush.add(toWei('80')));
  });

  it('Should not flush fund for a token if it is in the adding period', async () => {
    const { proxyBridge, flushReceiveSigner, testToken } = await loadFixture(deployContracts);
    // latestResetTimestamp = block.timestamp + 59 = X + 59
    await proxyBridge.addSupportedTokens(testToken.address, toWei('10'), (await time.latest()) + 60);
    // block.timestamp = X + 1
    await testToken.mint(proxyBridge.address, toWei('100'));
    const balanceBeforeFlush = await testToken.balanceOf(flushReceiveSigner.address);
    // block.timestamp = X + 2
    await proxyBridge.flushFund();
    const balanceAfterFlush = await testToken.balanceOf(flushReceiveSigner.address);
    expect(balanceAfterFlush).to.equal(balanceBeforeFlush);
  });

  it('Should not flush fund for a token if it is in the change allowance period', async () => {
    const { proxyBridge, flushReceiveSigner, testToken, defaultAdminSigner } = await loadFixture(deployContracts);

    const referenceTime = await time.latest(); // X

    await proxyBridge.addSupportedTokens(testToken.address, toWei('10'), referenceTime + 60); // + 1
    const latestResetTimestampAfterAddingSupport = (await proxyBridge.tokenAllowances(testToken.address))
      .latestResetTimestamp;
    expect(latestResetTimestampAfterAddingSupport).to.equal(referenceTime + 60);
    await testToken.mint(proxyBridge.address, toWei('100')); // + 1

    // await time.increase(60); // + 60
    // mine the next block after 60 mins
    await network.provider.request({
      method: 'evm_setNextBlockTimestamp',
      params: [toHexString(referenceTime + 60 + 1 + 1)],
    });
    await mine(1);

    await testToken.approve(proxyBridge.address, ethers.constants.MaxUint256); // + 1
    await testToken.mint(defaultAdminSigner.address, toWei('5')); // + 1
    // timestamp for the next transaction = X + 60 + 1 + 1 + 1 + 1 + 1 > X + 60 = latestResetTimestamp
    await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('5')); // + 1
    expect((await proxyBridge.tokenAllowances(testToken.address)).latestResetTimestamp).to.equal(
      latestResetTimestampAfterAddingSupport,
    );
    await proxyBridge.changeDailyAllowance(
      testToken.address,
      toWei('20'),
      referenceTime + 1 + 1 + 1 + 1 + 1 + 60 + ONE_DAY + 1,
    ); // + 1
    expect((await proxyBridge.tokenAllowances(testToken.address)).latestResetTimestamp).to.equal(
      referenceTime + ONE_DAY + 66,
    );
    const balanceBefore1stFlush = await testToken.balanceOf(flushReceiveSigner.address);
    // timestamp of the next transaction = X + 66 + 1 < X + ONE_DAY + 66
    await proxyBridge.flushFund(); // + 1
    const balanceAfter1stFlush = await testToken.balanceOf(flushReceiveSigner.address);
    expect(balanceAfter1stFlush).to.equal(balanceBefore1stFlush);
    // await time.increase(ONE_DAY); // + ONE_DAY
    await network.provider.request({
      method: 'evm_setNextBlockTimestamp',
      params: [toHexString(referenceTime + 60 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + ONE_DAY)],
    });
    await mine(1);

    const balanceBefore2ndFlush = await testToken.balanceOf(flushReceiveSigner.address);
    const balanceBridgeBefore2ndFlush = await testToken.balanceOf(proxyBridge.address);
    // timestamp of the next transaction = X + 60 + 7 + ONE_DAY + 1 > X + ONE_DAY + 66
    await proxyBridge.flushFund();
    const balanceAfter2ndFlush = await testToken.balanceOf(flushReceiveSigner.address);
    const balanceBridgeAfter2ndFlush = await testToken.balanceOf(proxyBridge.address);
    expect(balanceAfter2ndFlush).to.equal(
      balanceBefore2ndFlush.add(balanceBridgeBefore2ndFlush.sub(toWei('20').mul(2))),
    );
    expect(balanceBridgeAfter2ndFlush).to.equal(toWei('20').mul(2));
  });
});

function toHexString(num: number): string {
  return `0x${num.toString(16)}`;
}
