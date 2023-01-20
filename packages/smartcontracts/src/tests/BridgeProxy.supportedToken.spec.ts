import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployContracts } from './testUtils/deployment';
import { getCurrentTimeStamp, toWei } from './testUtils/mathUtils';

describe('Add and Removed Supported ETH and ERC20 tokens', () => {
  describe('ERC20: adding and removing from the supported list', () => {
    describe('DEFAULT_ADMIN_ROLE', () => {
      it('Successfully add token to supported list & allowance by Admin role address', async () => {
        const { proxyBridge, testToken, testToken2, defaultAdminSigner } = await loadFixture(deployContracts);
        await proxyBridge.addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({}));
        // Adding the testToken2 as the supported token by Admin role only.
        expect(await proxyBridge.supportedTokens(testToken2.address)).to.equal(false);
        await proxyBridge
          .connect(defaultAdminSigner)
          .addSupportedTokens(testToken2.address, toWei('15'), getCurrentTimeStamp({}));
        // Checking RandomToken and it's allowance
        expect(await proxyBridge.supportedTokens(testToken.address)).to.equal(true);
        expect((await proxyBridge.tokenAllowances(testToken.address)).dailyAllowance.toString()).to.equal(toWei('15'));
        // Checking RandomToken2 and it's allowance
        expect(await proxyBridge.supportedTokens(testToken2.address)).to.equal(true);
        expect((await proxyBridge.tokenAllowances(testToken2.address)).dailyAllowance.toString()).to.equal(toWei('15'));
      });

      it('Unable to add existing token to supported list', async () => {
        const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
        await proxyBridge.addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({}));
        // This test should fail if adding already supported token
        await expect(
          proxyBridge
            .connect(defaultAdminSigner)
            .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({})),
        ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_ALREADY_SUPPORTED');
        expect(await proxyBridge.supportedTokens(testToken.address)).to.equal(true);
      });

      it('Successfully remove existing token by Admin address', async () => {
        const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
        await proxyBridge.addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({}));
        await proxyBridge.removeSupportedTokens(testToken.address);
        expect(await proxyBridge.connect(defaultAdminSigner).supportedTokens(testToken.address)).to.equal(false);
      });

      it('Unable to remove non-existing token from supported list', async () => {
        const { proxyBridge, testToken2, defaultAdminSigner } = await loadFixture(deployContracts);
        await expect(
          proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(testToken2.address),
        ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_NOT_SUPPORTED');
      });
    });

    describe('OPERATIONAL_ROLE', () => {
      it('OPERATIONAL_ROLE address able to add token', async () => {
        const { proxyBridge, testToken2, operationalAdminSigner } = await loadFixture(deployContracts);
        // Adding the supported toke by OPERATIONAL_ROLE address
        await proxyBridge
          .connect(operationalAdminSigner)
          .addSupportedTokens(testToken2.address, toWei('15'), getCurrentTimeStamp({}));
        // Checking RandomToken2 and it's allowance
        expect(await proxyBridge.supportedTokens(testToken2.address)).to.equal(true);
        expect((await proxyBridge.tokenAllowances(testToken2.address)).dailyAllowance.toString()).to.equal(toWei('15'));
      });

      it('Unable to add existing token to supported list', async () => {
        const { proxyBridge, testToken, operationalAdminSigner } = await loadFixture(deployContracts);
        await proxyBridge.addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({}));
        // This test should fail if adding already supported token
        await expect(
          proxyBridge
            .connect(operationalAdminSigner)
            .addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({})),
        ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_ALREADY_SUPPORTED');
        expect(await proxyBridge.supportedTokens(testToken.address)).to.equal(true);
      });

      it('Successfully remove existing token by OPERATIONAL_ROLE address', async () => {
        const { proxyBridge, testToken, operationalAdminSigner } = await loadFixture(deployContracts);
        await proxyBridge.addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({}));
        await proxyBridge.removeSupportedTokens(testToken.address);
        expect(await proxyBridge.connect(operationalAdminSigner).supportedTokens(testToken.address)).to.equal(false);
      });

      it('Unable to remove non-existing token from supported list', async () => {
        const { proxyBridge, testToken2, defaultAdminSigner } = await loadFixture(deployContracts);
        await expect(
          proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(testToken2.address),
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
            .addSupportedTokens(testToken2.address, toWei('15'), getCurrentTimeStamp({})),
        ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
      });

      it('NON-ADMIN_ROLES address unable to remove token', async () => {
        const { proxyBridge, testToken, arbitrarySigner } = await loadFixture(deployContracts);
        await proxyBridge.addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({}));
        // Revert with the custom error 'NON_AUTHORIZED_ADDRESS'
        await expect(
          proxyBridge.connect(arbitrarySigner).removeSupportedTokens(testToken.address),
        ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
      });
    });
  });
  describe('Emitted Events', () => {
    it('Successfully emitted the event when the supported token added by Admin Addresses', async () => {
      const { proxyBridge, testToken, testToken2, defaultAdminSigner, operationalAdminSigner } = await loadFixture(
        deployContracts,
      );
      // Event called ADD_SUPPORTED_TOKEN should be emitted when Successfully added a token in supported list. Only admins are able to call the tokens
      await expect(
        proxyBridge
          .connect(defaultAdminSigner)
          .addSupportedTokens(testToken.address, toWei('10'), getCurrentTimeStamp({})),
      )
        .to.emit(proxyBridge, 'ADD_SUPPORTED_TOKEN')
        .withArgs(testToken.address, toWei('10'));

      // Event called ADD_SUPPORTED_TOKEN should be emitted when Successfully added a token in supported list. Only admins are able to call the tokens
      await expect(
        proxyBridge
          .connect(operationalAdminSigner)
          .addSupportedTokens(testToken2.address, toWei('10'), getCurrentTimeStamp({})),
      )
        .to.emit(proxyBridge, 'ADD_SUPPORTED_TOKEN')
        .withArgs(testToken2.address, toWei('10'));
    });

    it('Successfully emitted the event when the supported token removed by Admin Addresses', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await proxyBridge.addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({}));
      // Event called REMOVE_SUPPORTED_TOKEN should be emitted when Successfully removed a token from supported list. Only admins are able to call the tokens
      await expect(proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(testToken.address))
        .to.emit(proxyBridge, 'REMOVE_SUPPORTED_TOKEN')
        .withArgs(testToken.address);
    });
  });

  describe('ETH: adding and removing from the supported list', () => {
    describe('DEFAULT_ADMIN_ROLE ', () => {
      it('Admin adding the Ether as a supported token', async () => {
        const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
        // By default ether is supported by all smart contracts on mainnet. When calling 'addSupportedTokens', it sets the ether allowance to '_dailyAllowance'
        // User will not be able to withdraw more than '_dailyAllowance' set.
        // Set Allowance to 10 ether by admin address
        await proxyBridge
          .connect(defaultAdminSigner)
          .addSupportedTokens(ethers.constants.AddressZero, toWei('10'), getCurrentTimeStamp({}));
        expect(await (await proxyBridge.tokenAllowances(ethers.constants.AddressZero)).dailyAllowance).to.equal(
          toWei('10'),
        );
      });

      it('Admin removes Ether as a supported token', async () => {
        const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
        // Set Allowance to 10 ether by admin address
        await proxyBridge
          .connect(defaultAdminSigner)
          .addSupportedTokens(ethers.constants.AddressZero, toWei('10'), getCurrentTimeStamp({}));
        // When removing ether from the supported list, we can set the '_dailyAllowance' to 0.
        // This will freeze of ether to DefiChain.
        // Set Allowance to 0 ether by admin address
        await proxyBridge.connect(defaultAdminSigner).removeSupportedTokens(ethers.constants.AddressZero);
        expect(await proxyBridge.supportedTokens(ethers.constants.AddressZero)).to.equal(false);
      });
    });

    describe('OPERATIONAL_ROLE', () => {
      it('Operational adding the Ether as a supported token', async () => {
        const { proxyBridge, operationalAdminSigner } = await loadFixture(deployContracts);
        // Set Allowance to 10 ether by operational address
        await proxyBridge
          .connect(operationalAdminSigner)
          .addSupportedTokens(ethers.constants.AddressZero, toWei('10'), getCurrentTimeStamp({}));
        expect(await (await proxyBridge.tokenAllowances(ethers.constants.AddressZero)).dailyAllowance).to.equal(
          toWei('10'),
        );
      });

      it('Operational removes Ether as a supported token', async () => {
        const { proxyBridge, operationalAdminSigner } = await loadFixture(deployContracts);
        // Set Allowance to 10 ether by Operational address
        await proxyBridge
          .connect(operationalAdminSigner)
          .addSupportedTokens(ethers.constants.AddressZero, toWei('10'), getCurrentTimeStamp({}));
        // Set Allowance to 0 ether by Operational address
        await proxyBridge.connect(operationalAdminSigner).removeSupportedTokens(ethers.constants.AddressZero);
        expect(await proxyBridge.supportedTokens(ethers.constants.AddressZero)).to.equal(false);
      });
    });

    describe('ARBITRARY_EOA', () => {
      it('Only admin and Operational address can add supported token', async () => {
        const { proxyBridge, arbitrarySigner } = await loadFixture(deployContracts);
        // Set Allowance to 10 ether by EOA address
        await expect(
          proxyBridge
            .connect(arbitrarySigner)
            .addSupportedTokens(ethers.constants.AddressZero, toWei('10'), getCurrentTimeStamp({})),
        ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
      });

      it('Only admin and Operational address can remove supported token', async () => {
        const { proxyBridge, arbitrarySigner } = await loadFixture(deployContracts);
        // Set Allowance to 0 ether by EOA address
        await expect(
          proxyBridge.connect(arbitrarySigner).removeSupportedTokens(ethers.constants.AddressZero),
        ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
      });
    });
  });
});
