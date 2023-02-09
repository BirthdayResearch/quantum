import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';

import { deployContracts } from './testUtils/deployment';
import { toWei } from './testUtils/mathUtils';

describe('Withdrawal tests', () => {
  describe('DEFAULT_ADMIN_ROLE', () => {
    it('Successful Withdrawal by Admin only', async () => {
      const { proxyBridge, testToken, testToken2, defaultAdminSigner } = await loadFixture(deployContracts);
      // Minting 100 tokens to Bridge
      await testToken.mint(proxyBridge.address, toWei('100'));
      await testToken2.mint(proxyBridge.address, toWei('100'));
      // Checking the current balance
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('100'));
      expect(await testToken2.balanceOf(proxyBridge.address)).to.equal(toWei('100'));

      // Withdrawal by Admin
      let tx = await proxyBridge.connect(defaultAdminSigner).withdraw(testToken.address, toWei('20'));
      await tx.wait();
      tx = await proxyBridge.connect(defaultAdminSigner).withdraw(testToken2.address, toWei('30'));
      await tx.wait();
      // Sanity check for account balances
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('80'));
      expect(await testToken2.balanceOf(proxyBridge.address)).to.equal(toWei('70'));
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('20'));
      expect(await testToken2.balanceOf(defaultAdminSigner.address)).to.equal(toWei('30'));
    });

    it('Unable to withdraw more than the balance of the Bridge', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      // Contract balance of testToken is '0'
      // Test should be revert with a mention string if Admin requesting amount bigger than actual balance of the Bridge.
      await expect(
        proxyBridge.connect(defaultAdminSigner).withdraw(testToken.address, toWei('110')),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
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
