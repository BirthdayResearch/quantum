import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployContracts } from './testUtils/deployment';
import { toWei } from './testUtils/mathUtils';

describe('Withdrawal tests', () => {
  describe('DEFAULT_ADMIN_ROLE', () => {
    it('Successful Withdrawal of ERC20 by Admin only', async () => {
      const { proxyBridge, testToken, testToken2, defaultAdminSigner, flushReceiveSigner } = await loadFixture(
        deployContracts,
      );
      // Minting 100 tokens to Bridge
      await testToken.mint(proxyBridge.address, toWei('100'));
      await testToken2.mint(proxyBridge.address, toWei('100'));
      // Checking the current balance
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('100'));
      expect(await testToken2.balanceOf(proxyBridge.address)).to.equal(toWei('100'));
      // Checking flush address balance before the withdraw
      expect(await testToken.balanceOf(flushReceiveSigner.address)).to.be.equal(0);
      // Withdrawal by Admin
      let tx = await proxyBridge.connect(defaultAdminSigner).withdraw(testToken.address, toWei('20'));
      await tx.wait();
      tx = await proxyBridge.connect(defaultAdminSigner).withdraw(testToken2.address, toWei('30'));
      await tx.wait();
      // Sanity check for account balances
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('80'));
      expect(await testToken2.balanceOf(proxyBridge.address)).to.equal(toWei('70'));
      expect(await testToken.balanceOf(flushReceiveSigner.address)).to.equal(toWei('20'));
      expect(await testToken2.balanceOf(flushReceiveSigner.address)).to.equal(toWei('30'));
    });

    it('Successful withdrawal of ETH by Admin only', async () => {
      const { proxyBridge, defaultAdminSigner, flushReceiveSigner } = await loadFixture(deployContracts);
      await expect(
        defaultAdminSigner.sendTransaction({
          to: proxyBridge.address,
          value: toWei('100'),
        }),
      )
        .to.emit(proxyBridge, 'ETH_RECEIVED_VIA_RECEIVE_FUNCTION')
        .withArgs(defaultAdminSigner.address, toWei('100'));
      expect(await ethers.provider.getBalance(proxyBridge.address)).to.equal(toWei('100'));
      const balanceAdminBeforeWithdraw = await ethers.provider.getBalance(flushReceiveSigner.address);
      const balanceBridgeBeforeWithdraw = await ethers.provider.getBalance(proxyBridge.address);
      const tx = await proxyBridge.connect(defaultAdminSigner).withdraw(ethers.constants.AddressZero, toWei('10'));
      await tx.wait();
      const balanceAdminAfterWithdraw = await ethers.provider.getBalance(flushReceiveSigner.address);
      const balanceBridgeAfterWithdraw = await ethers.provider.getBalance(proxyBridge.address);
      expect(balanceAdminAfterWithdraw).to.equal(balanceAdminBeforeWithdraw.add(toWei('10')));
      expect(balanceBridgeAfterWithdraw).to.equal(balanceBridgeBeforeWithdraw.sub(toWei('10')));
    });

    it('Unable to withdraw more ERC20 than the balance of the Bridge', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      // Contract balance of testToken is '0'
      // Test should be revert with a mention string if Admin requesting amount bigger than actual balance of the Bridge.
      await expect(
        proxyBridge.connect(defaultAdminSigner).withdraw(testToken.address, toWei('110')),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('Unable to withdraw more ETH than the balance of the Bridge', async () => {
      const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
      await defaultAdminSigner.sendTransaction({
        to: proxyBridge.address,
        value: toWei('2'),
      });
      expect(await ethers.provider.getBalance(proxyBridge.address)).to.equal(toWei('2'));
      await expect(
        proxyBridge.connect(defaultAdminSigner).withdraw(ethers.constants.AddressZero, toWei('10')),
      ).to.revertedWithCustomError(proxyBridge, 'ETH_TRANSFER_FAILED');
    });
  });
  describe('OPERATIONAL_ROLE', () => {
    it('Unsuccessful withdrawal by Operational Admin', async () => {
      const { proxyBridge, testToken, operationalAdminSigner } = await loadFixture(deployContracts);
      // Withdrawal by Operation Admin should be rejected
      await expect(
        proxyBridge.connect(operationalAdminSigner).withdraw(testToken.address, toWei('20')),
      ).to.be.revertedWith(
        // address from hardcoded Hardhat network accounts
        'AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000',
      );
    });
  });
  describe('ARBITRARY_EOA', () => {
    it('Unsuccessful withdrawal by other EOA', async () => {
      const { proxyBridge, arbitrarySigner, testToken } = await loadFixture(deployContracts);
      // Withdrawal by another Admin should be rejected
      await expect(proxyBridge.connect(arbitrarySigner).withdraw(testToken.address, toWei('20'))).to.be.revertedWith(
        // address from hardcoded Hardhat network accounts
        'AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x0000000000000000000000000000000000000000000000000000000000000000',
      );
    });
  });
});
