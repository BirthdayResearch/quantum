import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';

import { deployContracts } from './testUtils/deployment';

describe('Transaction fee tests', () => {
  describe('DEFAULT_ADMIN_ROLE', () => {
    it('Successfully implemented the 0.3% fee', async () => {
      const { proxyBridge } = await loadFixture(deployContracts);
      // Checking if the implemented fee is 0.3%
      await expect(await proxyBridge.transactionFee()).to.equal(30);
    });

    it('Successfully changes the fee by Admin account', async () => {
      const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
      // Admin should successfully changes the tx fees to 0.05%
      await proxyBridge.connect(defaultAdminSigner).changeTxFee(5);
      // New fee should be 0.05%
      await expect(await proxyBridge.transactionFee()).to.equal(5);
    });
    describe('Emitted Events', () => {
      it('Successfully emitted the event on changes of txn fee', async () => {
        const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
        // Event called TRANSACTION_FEE_CHANGED should be emitted on Successful withdrawal by the Admin only
        await expect(proxyBridge.connect(defaultAdminSigner).changeTxFee(50))
          .to.emit(proxyBridge, 'TRANSACTION_FEE_CHANGED')
          .withArgs(30, 50);
      });
    });
  });

  describe('OPERATIONAL_ROLE', () => {
    it('Unable to change the fee by Operational address', async () => {
      const { proxyBridge, operationalAdminSigner } = await loadFixture(deployContracts);
      // Txn should revert with the AccessControl error
      await expect(proxyBridge.connect(operationalAdminSigner).changeTxFee(50)).to.be.rejectedWith(
        // address from hardcoded Hardhat network accounts
        'AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000',
      );
    });
  });

  describe('ARBITRARY_EOA', () => {
    it('Unable to change the fee by another address', async () => {
      const { proxyBridge, arbitrarySigner } = await loadFixture(deployContracts);
      // Txn should revert with the AccessControl error
      await expect(proxyBridge.connect(arbitrarySigner).changeTxFee(50)).to.be.revertedWith(
        // address from hardcoded Hardhat network accounts
        'AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x0000000000000000000000000000000000000000000000000000000000000000',
      );
    });
  });
});
