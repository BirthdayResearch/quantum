import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployContracts } from './testUtils/deployment';
import { getCurrentTimeStamp, toWei } from './testUtils/mathUtils';

describe('Add and Removed Supported ERC20 tokens', () => {
  describe('DEFAULT_ADMIN_ROLE', () => {
    it('Successfully add token to supported list & allowance by Admin role address', async () => {
      const { proxyBridge, testToken, testToken2, defaultAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken in current time + 60 secs
      await proxyBridge
        .connect(defaultAdminSigner)
        .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 }));
      // Adding the testToken2 as the supported token by Admin role only.
      expect(await proxyBridge.supportedTokens(testToken2.address)).to.equal(false);
      // Supporting testToken2 in current time + 60 secs
      await proxyBridge
        .connect(defaultAdminSigner)
        .addSupportedTokens(testToken2.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 }));
      // Checking testToken and it's allowance
      expect(await proxyBridge.supportedTokens(testToken.address)).to.equal(true);
      expect((await proxyBridge.tokenAllowances(testToken.address)).dailyAllowance.toString()).to.equal(toWei('15'));
      // Checking testToken2 and it's allowance
      expect(await proxyBridge.supportedTokens(testToken2.address)).to.equal(true);
      expect((await proxyBridge.tokenAllowances(testToken2.address)).dailyAllowance.toString()).to.equal(toWei('15'));
    });

    it('Unable to add existing token to supported list', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken in current time + 60 secs
      await proxyBridge
        .connect(defaultAdminSigner)
        .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 }));
      // This test should fail if adding already supported token
      await expect(
        proxyBridge
          .connect(defaultAdminSigner)
          .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 })),
      ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_ALREADY_SUPPORTED');
      expect(await proxyBridge.supportedTokens(testToken.address)).to.equal(true);
    });

    it('Successfully remove existing token by Admin address', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken in current time + 60 secs
      await proxyBridge
        .connect(defaultAdminSigner)
        .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 }));
      await proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(testToken.address);
      expect(await proxyBridge.supportedTokens(testToken.address)).to.equal(false);
    });

    it('Successfully revert if `_startAllowanceTimeFrom` passed block.timestamp', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken in currentTimeStamp. This will revert as the block.timestamp will be few secs ahead when executing this tx.
      await expect(
        proxyBridge
          .connect(defaultAdminSigner)
          .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp()),
      ).to.be.revertedWithCustomError(proxyBridge, 'INVALID_RESET_EPOCH_TIME');
    });

    it('Unable to remove non-existing token from supported list', async () => {
      const { proxyBridge, testToken2, defaultAdminSigner } = await loadFixture(deployContracts);
      await expect(
        proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(testToken2.address),
      ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_NOT_SUPPORTED');
    });

    it('Successfully revert if added token Address is 0x0', async () => {
      const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
      await expect(
        proxyBridge
          .connect(defaultAdminSigner)
          .addSupportedTokens(ethers.constants.AddressZero, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 })),
      ).to.be.revertedWithCustomError(proxyBridge, 'ZERO_ADDRESS');
    });
  });

  describe('OPERATIONAL_ROLE', () => {
    it('OPERATIONAL_ROLE address able to add token', async () => {
      const { proxyBridge, testToken2, operationalAdminSigner } = await loadFixture(deployContracts);
      // Adding the supported toke by OPERATIONAL_ROLE address
      // Supporting testToken2 in current time + 60 secs
      await proxyBridge
        .connect(operationalAdminSigner)
        .addSupportedTokens(testToken2.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 }));
      // Checking testToken2 and it's allowance
      expect(await proxyBridge.supportedTokens(testToken2.address)).to.equal(true);
      expect((await proxyBridge.tokenAllowances(testToken2.address)).dailyAllowance.toString()).to.equal(toWei('15'));
    });

    it('Unable to add existing token to supported list', async () => {
      const { proxyBridge, testToken, operationalAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken in current time + 60 secs
      await proxyBridge
        .connect(operationalAdminSigner)
        .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 }));
      // This test should fail if adding already supported token
      await expect(
        proxyBridge
          .connect(operationalAdminSigner)
          .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 })),
      ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_ALREADY_SUPPORTED');
      expect(await proxyBridge.supportedTokens(testToken.address)).to.equal(true);
    });

    it('Successfully remove existing token by OPERATIONAL_ROLE address', async () => {
      const { proxyBridge, testToken, operationalAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken in current time + 60 secs
      await proxyBridge
        .connect(operationalAdminSigner)
        .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 }));
      await proxyBridge.connect(operationalAdminSigner).removeSupportedTokens(testToken.address);
      expect(await proxyBridge.connect(operationalAdminSigner).supportedTokens(testToken.address)).to.equal(false);
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
      // This test should fail if adding token by non-ADMIN_ROLE
      await expect(
        proxyBridge
          .connect(arbitrarySigner)
          .addSupportedTokens(testToken2.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 })),
      ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
    });

    it('NON-ADMIN_ROLES address unable to remove token', async () => {
      const { proxyBridge, testToken, defaultAdminSigner, arbitrarySigner } = await loadFixture(deployContracts);
      // Supporting testToken in current time + 60 secs
      await proxyBridge
        .connect(defaultAdminSigner)
        .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 }));
      // Revert with the custom error 'NON_AUTHORIZED_ADDRESS'
      await expect(
        proxyBridge.connect(arbitrarySigner).removeSupportedTokens(testToken.address),
      ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
    });
  });

  describe('Emitted Events', () => {
    it('Successfully emitted the event when the supported token added by Admin Addresses', async () => {
      const { proxyBridge, testToken, testToken2, defaultAdminSigner, operationalAdminSigner } = await loadFixture(
        deployContracts,
      );
      // Event called ADD_SUPPORTED_TOKEN should be emitted when Successfully added a token in supported list. Only admins are able to call the tokens
      // Supporting testToken in current time + 60 secs
      await expect(
        proxyBridge
          .connect(defaultAdminSigner)
          .addSupportedTokens(testToken.address, toWei('10'), getCurrentTimeStamp({ additionalTime: 60 })),
      )
        .to.emit(proxyBridge, 'ADD_SUPPORTED_TOKEN')
        .withArgs(testToken.address, toWei('10'));

      // Event called ADD_SUPPORTED_TOKEN should be emitted when Successfully added a token in supported list. Only admins are able to call the tokens
      // Supporting testToken2 in current time + 60 secs
      await expect(
        proxyBridge
          .connect(operationalAdminSigner)
          .addSupportedTokens(testToken2.address, toWei('10'), getCurrentTimeStamp({ additionalTime: 60 })),
      )
        .to.emit(proxyBridge, 'ADD_SUPPORTED_TOKEN')
        .withArgs(testToken2.address, toWei('10'));
    });

    it('Successfully emitted the event when the supported token removed by Admin Addresses', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      // Supporting testToken in current time + 60 secs
      await proxyBridge
        .connect(defaultAdminSigner)
        .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 }));
      // Event called REMOVE_SUPPORTED_TOKEN should be emitted when Successfully removed a token from supported list. Only admins are able to call the tokens
      await expect(proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(testToken.address))
        .to.emit(proxyBridge, 'REMOVE_SUPPORTED_TOKEN')
        .withArgs(testToken.address);
    });
  });
});
