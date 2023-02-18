import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployContracts } from './testUtils/deployment';
import { toWei } from './testUtils/mathUtils';

describe('Add and Removed Supported ERC20 tokens, and Token`s hard cap tests', () => {
  describe('DEFAULT_ADMIN_ROLE', () => {
    it('Successfully add token to supported list & changed token`s hard cap by Admin role address', async () => {
      const { proxyBridge, testToken, testToken2, defaultAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken with hard cap of 15
      await proxyBridge.connect(defaultAdminSigner).addSupportedTokens(testToken.address, toWei('15'));
      // Adding the testToken2 as the supported token by Admin role only.
      expect(await proxyBridge.isSupported(testToken2.address)).to.equal(false);
      // Supporting testToken2 with hard cap of 15
      await proxyBridge.connect(defaultAdminSigner).addSupportedTokens(testToken2.address, toWei('20'));
      // Checking testToken and hard cap
      expect(await proxyBridge.isSupported(testToken.address)).to.equal(true);
      expect(await proxyBridge.tokenCap(testToken.address)).to.equal(toWei('15'));
      // Checking testToken2 and hard cap
      expect(await proxyBridge.isSupported(testToken2.address)).to.equal(true);
      expect(await proxyBridge.tokenCap(testToken2.address)).to.equal(toWei('20'));
      // Changing testToken `tokenCap` to 50 testTokens
      await expect(proxyBridge.connect(defaultAdminSigner).changeTokenCap(testToken.address, toWei('50')));
      expect(await proxyBridge.tokenCap(testToken.address)).to.be.equal(toWei('50'));
    });

    it('Unable to add existing token to supported list', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken with hard cap of 15
      await proxyBridge.connect(defaultAdminSigner).addSupportedTokens(testToken.address, toWei('15'));
      // This test should fail if adding already supported token
      await expect(
        proxyBridge.connect(defaultAdminSigner).addSupportedTokens(testToken.address, toWei('15')),
      ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_ALREADY_SUPPORTED');
      expect(await proxyBridge.isSupported(testToken.address)).to.equal(true);
    });

    it('Successfully remove existing token by Admin address', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken with hard cap of 15
      await proxyBridge.connect(defaultAdminSigner).addSupportedTokens(testToken.address, toWei('15'));
      // Removing testToken from the supported list
      await proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(testToken.address);
      expect(await proxyBridge.isSupported(testToken.address)).to.equal(false);
      expect(await proxyBridge.tokenCap(testToken.address)).to.equal(0);
    });

    it('Unable to remove non-existing token from supported list', async () => {
      const { proxyBridge, testToken2, defaultAdminSigner } = await loadFixture(deployContracts);
      await expect(
        proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(testToken2.address),
      ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_NOT_SUPPORTED');
    });

    it('Unable to remove ETH when not supported yet', async () => {
      const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
      await expect(
        proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(ethers.constants.AddressZero),
      ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_NOT_SUPPORTED');
    });

    it('Successfully add and remove support for ETH', async () => {
      const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
      await proxyBridge.connect(defaultAdminSigner).addSupportedTokens(ethers.constants.AddressZero, toWei('10'));
      expect(await proxyBridge.isSupported(ethers.constants.AddressZero)).to.equal(true);
      expect(await proxyBridge.tokenCap(ethers.constants.AddressZero)).to.equal(toWei('10'));
      await proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(ethers.constants.AddressZero);
      expect(await proxyBridge.isSupported(ethers.constants.AddressZero)).to.equal(false);
      expect(await proxyBridge.tokenCap(ethers.constants.AddressZero)).to.equal(0);
    });
  });

  describe('OPERATIONAL_ROLE', () => {
    it('OPERATIONAL_ROLE address able to add token and change token`s cap', async () => {
      const { proxyBridge, testToken2, operationalAdminSigner } = await loadFixture(deployContracts);
      // Adding the supported toke by OPERATIONAL_ROLE address
      // Supporting testToken with hard cap of 15
      await proxyBridge.connect(operationalAdminSigner).addSupportedTokens(testToken2.address, toWei('15'));
      // Checking testToken2 and hard cap
      expect(await proxyBridge.isSupported(testToken2.address)).to.equal(true);
      expect(await proxyBridge.tokenCap(testToken2.address)).to.equal(toWei('15'));
      // Changing testToken `tokenCap` to 50 testTokens
      await expect(proxyBridge.connect(operationalAdminSigner).changeTokenCap(testToken2.address, toWei('50')));
      expect(await proxyBridge.tokenCap(testToken2.address)).to.be.equal(toWei('50'));
    });

    it('Unable to add existing token to supported list', async () => {
      const { proxyBridge, testToken, operationalAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken with hard cap of 15
      await proxyBridge.connect(operationalAdminSigner).addSupportedTokens(testToken.address, toWei('15'));
      // This test should fail when adding already supported token
      await expect(
        proxyBridge.connect(operationalAdminSigner).addSupportedTokens(testToken.address, toWei('15')),
      ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_ALREADY_SUPPORTED');
      expect(await proxyBridge.isSupported(testToken.address)).to.equal(true);
    });

    it('Successfully remove existing token by OPERATIONAL_ROLE address', async () => {
      const { proxyBridge, testToken, operationalAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken with hard cap of 15
      await proxyBridge.connect(operationalAdminSigner).addSupportedTokens(testToken.address, toWei('15'));
      // Removing testToken from the supported list
      await proxyBridge.connect(operationalAdminSigner).removeSupportedTokens(testToken.address);
      expect(await proxyBridge.isSupported(testToken.address)).to.equal(false);
      expect(await proxyBridge.tokenCap(testToken.address)).to.equal(0);
    });

    it('Unable to remove non-existing token from supported list', async () => {
      const { proxyBridge, testToken2, operationalAdminSigner } = await loadFixture(deployContracts);
      await expect(
        proxyBridge.connect(operationalAdminSigner).removeSupportedTokens(testToken2.address),
      ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_NOT_SUPPORTED');
    });
  });

  describe('ARBITRARY_EOA', () => {
    it('NON-ADMIN_ROLES address unable to add token', async () => {
      const { proxyBridge, testToken2, arbitrarySigner } = await loadFixture(deployContracts);
      // This test should fail when adding token by non-ADMIN_ROLES
      await expect(
        proxyBridge.connect(arbitrarySigner).addSupportedTokens(testToken2.address, toWei('15')),
      ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
    });

    it('NON-ADMIN_ROLES address unable to remove token', async () => {
      const { proxyBridge, testToken, defaultAdminSigner, arbitrarySigner } = await loadFixture(deployContracts);
      // Supporting testToken with hard cap of 15
      await proxyBridge.connect(defaultAdminSigner).addSupportedTokens(testToken.address, toWei('15'));
      // Revert with the custom error 'NON_AUTHORIZED_ADDRESS'
      await expect(
        proxyBridge.connect(arbitrarySigner).removeSupportedTokens(testToken.address),
      ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
    });

    it('NON-ADMIN_ROLES address unable to change token`s cap', async () => {
      const { proxyBridge, testToken, defaultAdminSigner, arbitrarySigner } = await loadFixture(deployContracts);
      // Supporting testToken with hard cap of 15
      await proxyBridge.connect(defaultAdminSigner).addSupportedTokens(testToken.address, toWei('15'));
      // Revert with the custom error 'NON_AUTHORIZED_ADDRESS'
      await expect(
        proxyBridge.connect(arbitrarySigner).changeTokenCap(testToken.address, toWei('50')),
      ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
    });
  });

  describe('Emitted Events', () => {
    it('Successfully emitted the event when the supported token added by Admin Addresses', async () => {
      const { proxyBridge, testToken, testToken2, defaultAdminSigner, operationalAdminSigner } = await loadFixture(
        deployContracts,
      );
      // Event called ADD_SUPPORTED_TOKEN should be emitted when Successfully added a token in supported list. Only admins are able to call the tokens
      // Supporting testToken with hard cap of 10
      await expect(proxyBridge.connect(defaultAdminSigner).addSupportedTokens(testToken.address, toWei('10')))
        .to.emit(proxyBridge, 'ADD_SUPPORTED_TOKEN')
        .withArgs(testToken.address, toWei('10'));

      // Event called ADD_SUPPORTED_TOKEN should be emitted when Successfully added a token in supported list. Only admins are able to call the tokens
      // Supporting testToken with hard cap of 10
      await expect(proxyBridge.connect(operationalAdminSigner).addSupportedTokens(testToken2.address, toWei('10')))
        .to.emit(proxyBridge, 'ADD_SUPPORTED_TOKEN')
        .withArgs(testToken2.address, toWei('10'));
    });

    it('Successfully emitted the event when the supported token removed by Admin Addresses', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken with hard cap of 15
      await proxyBridge.connect(defaultAdminSigner).addSupportedTokens(testToken.address, toWei('15'));
      // Event called REMOVE_SUPPORTED_TOKEN should be emitted when Successfully removed a token from supported list. Only admins are able to call the tokens
      await expect(proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(testToken.address))
        .to.emit(proxyBridge, 'REMOVE_SUPPORTED_TOKEN')
        .withArgs(testToken.address);
    });

    it('Successfully emitted the event when the supported token`s cap changed by Admin Addresses', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken with hard cap of 10
      await proxyBridge.connect(defaultAdminSigner).addSupportedTokens(testToken.address, toWei('10'));
      const capBefore = await proxyBridge.tokenCap(testToken.address);
      expect(capBefore).to.be.equal(toWei('10'));
      // Changing testToken's cap to 40 testTokens
      await expect(proxyBridge.changeTokenCap(testToken.address, toWei('40')))
        .to.emit(proxyBridge, 'CHANGE_TOKEN_CAP')
        .withArgs(testToken.address, capBefore, toWei('40'));
    });
  });
});
