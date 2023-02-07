import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeV2, TestToken } from '../generated';
import { deployContracts } from './testUtils/deployment';
import { getCurrentTimeStamp, toWei } from './testUtils/mathUtils';

// initMintAndSupport will mint to the EOA address and approve contractAddress.
// This is primarily to help avoid the repetition.
async function initMintAndSupport(
  proxyBridge: BridgeV2,
  testToken: TestToken,
  eoaAddress: string,
  contractAddress: string,
) {
  await testToken.mint(eoaAddress, toWei('100'));
  await testToken.approve(contractAddress, ethers.constants.MaxInt256);
  // Daily allowance amount set to 15 testToken
  // TestToken supported in currentTime + 60 secs
  await proxyBridge.addSupportedTokens(testToken.address, toWei('15'), getCurrentTimeStamp({ additionalTime: 60 }));
}

describe('Daily allowance tests', () => {
  describe('Allowance tests - ERC20', () => {
    it('Successfully revert if exceed daily allowance', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Increase time by 60 secs
      await time.increase(60);
      // Testing with testToken (already added in supported token)
      // Daily allowance is 15. Should revert with the error if exceeding daily allowance
      // Current daily usage should be zero
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(0);
      // Bridging 15 token to defiChain. After this txn only able to bridge dailyAllowance(15) - 15 = 0 tokens
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('15'));
      // Contract balance should be 15
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('15'));
      // Initial balance is 100, should be 85.
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('85'));
      // Current daily usage should be 15
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
      // This txn should revert if the exceeding daily balance of 15
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('20')),
      ).to.be.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
      // Current daily usage should be 15. Above txn didn't succeed
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
    });

    it('Resetting daily allowance after a day', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Increase time by 60 secs
      await time.increase(60);
      // Testing with testToken (already added in supported token)
      // Daily allowance is 15. Should revert with the error if exceeding daily allowance
      // Current daily usage should be zero
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(0);
      // Bridging 15 token to defiChain. After this txn only able to bridge dailyAllowance(15) - 15 = 0 tokens
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('15'));
      // Initial balance is 100, should be 85.
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('85'));
      // Current daily usage should be 15
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
      // This txn should revert if the exceeding daily balance of 15
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('20')),
      ).to.be.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
      // Current daily usage should be 15. Above txn didn't succeed
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
      // Waiting for a day to reset the allowance.
      await time.increase(60 * 60 * 25);
      // After a day. Bridging 12 token. Txn should not revert.
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('12'));
      // This txn should revert if the exceeding daily balance of 15
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('4')),
      ).to.be.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
      // Current daily usage should be 12
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('12'));
      // Bridging 3 token again. Txn should not revert.
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('3'));
      // Current daily usage should be 15
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
    });

    it('Resetting daily allowance in span of multiple days', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Increase time by 60 secs
      await time.increase(60);
      const prevAllowance = await proxyBridge.tokenAllowances(testToken.address);
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10'));

      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('2'));

      // Increasing time by 2 days and an hr (In seconds)
      await time.increase(60 * 60 * 49);
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('9'));

      // Increasing time by 1 day (In seconds)
      await time.increase(60 * 60 * 24);
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('14'));
      const allowance = await proxyBridge.tokenAllowances(testToken.address);

      // Checking previous epoch
      expect(allowance[0]).to.equal(prevAllowance[0].add(60 * 60 * 72));
      // Checking daily allowance
      expect(allowance[1]).to.equal(toWei('15'));
      // Checking current daily usage
      expect(allowance[2]).to.equal(toWei('14'));
    });

    it('Change daily allowance and reset time', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Increase time by 60 secs
      await time.increase(60);
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10'));
      const timeStamp2Days = getCurrentTimeStamp({ additionalTime: 60 * 60 * 49 });
      // Setting daily allowance to 5 tokens
      await proxyBridge.changeDailyAllowance(testToken.address, toWei('10'), timeStamp2Days);
      expect((await proxyBridge.tokenAllowances(testToken.address)).latestResetTimestamp).to.equal(timeStamp2Days);
      // No bridging to defiChain and changeDailyAllowance, result of being in 'CHANGE ALLOWANCE PERIOD'
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('5')),
      ).to.be.revertedWithCustomError(proxyBridge, 'STILL_IN_CHANGE_ALLOWANCE_PERIOD');
      // Increasing time by 1 day
      await time.increase(60 * 60 * 24);
      // Bridging 10 test tokens
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10')),
      ).to.be.revertedWithCustomError(proxyBridge, 'STILL_IN_CHANGE_ALLOWANCE_PERIOD');
      // Increasing time by 1 day and an hour
      await time.increase(60 * 60 * 25);
      // Bridging test tokens
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10'));
      // This tx should fail as the dailyAllowance has been met
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('9')),
      ).to.be.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
      // Contract balance should be 20 test tokens
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('20'));
    });
    describe('Emitted Events', () => {
      it('Successfully emitted event when changing allowances', async () => {
        const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
        await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
        // Increase time by 60 secs
        await time.increase(60);
        const prevTimeStamp = (await proxyBridge.tokenAllowances(testToken.address)).latestResetTimestamp;
        const currentTime = getCurrentTimeStamp({ additionalTime: 60 * 60 * 25 });
        // Event called CHANGE_DAILY_ALLOWANCE should be emitted when changes token's allowances
        await expect(proxyBridge.changeDailyAllowance(testToken.address, toWei('10'), currentTime))
          .to.emit(proxyBridge, 'CHANGE_DAILY_ALLOWANCE')
          .withArgs(testToken.address, toWei('10'), prevTimeStamp, currentTime);
      });
    });

    it('Changing allowance for two ERC20 tokens', async () => {
      const { proxyBridge, testToken, testToken2, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Increase time by 60 secs
      await time.increase(60);
      // Minting (to defaultAdminSigner) and approving testToken2 for proxyBridge.
      await testToken2.mint(defaultAdminSigner.address, toWei('100'));
      await testToken2.approve(proxyBridge.address, ethers.constants.MaxInt256);
      // Adding testToken2 in supported token with the daily allowance of 20 tokens
      // TestToken2 supported in currentTime + 120 secs
      await proxyBridge.addSupportedTokens(
        testToken2.address,
        toWei('20'),
        getCurrentTimeStamp({ additionalTime: 120 }),
      );
      // Increase time by 60 secs
      await time.increase(60);
      // Check on dailyAllowance of testToken and testToken2
      expect((await proxyBridge.tokenAllowances(testToken.address))[1]).to.equal(toWei('15'));
      expect((await proxyBridge.tokenAllowances(testToken2.address))[1]).to.equal(toWei('20'));
      // TestToken allowance set to 15, changing it to 25 tokens
      await proxyBridge
        .connect(defaultAdminSigner)
        .changeDailyAllowance(testToken.address, toWei('25'), getCurrentTimeStamp({ additionalTime: 60 * 60 * 25 }));
      // TestToken2 allowance set to 20, changing it to 30 tokens
      await proxyBridge
        .connect(defaultAdminSigner)
        .changeDailyAllowance(testToken2.address, toWei('30'), getCurrentTimeStamp({ additionalTime: 60 * 60 * 25 }));
      // Check on dailyAllowance after changing the dailyAllowance
      expect((await proxyBridge.tokenAllowances(testToken.address))[1]).to.equal(toWei('25'));
      expect((await proxyBridge.tokenAllowances(testToken2.address))[1]).to.equal(toWei('30'));
    });

    it('Successfully revert if the new reset time before current time stamp', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Increase time by 60 secs
      await time.increase(60);
      // Current time - 1 day
      const timeInPast = getCurrentTimeStamp() - 60 * 60 * 24;
      await expect(
        proxyBridge.changeDailyAllowance(testToken.address, toWei('10'), timeInPast),
      ).to.be.revertedWithCustomError(proxyBridge, 'INVALID_RESET_EPOCH_TIME');
    });

    describe('Daily Allowance change by different accounts', async () => {
      it('DEFAULT_ADMIN_ROLE', async () => {
        const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
        await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
        // Increase time by 60 secs
        await time.increase(60);
        // Admin changing the allowance of testToken
        expect((await proxyBridge.tokenAllowances(testToken.address)).dailyAllowance).to.equal(toWei('15'));
        await proxyBridge
          .connect(defaultAdminSigner)
          .changeDailyAllowance(testToken.address, toWei('10'), getCurrentTimeStamp({ additionalTime: 60 * 60 * 25 }));
        expect((await proxyBridge.tokenAllowances(testToken.address)).dailyAllowance).to.equal(toWei('10'));
      });

      it('OPERATIONAL_ROLE', async () => {
        const { proxyBridge, testToken, defaultAdminSigner, operationalAdminSigner } = await loadFixture(
          deployContracts,
        );
        await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
        // Increase time by 60 secs
        await time.increase(60);
        // Operation changing the allowance of testToken
        await proxyBridge
          .connect(operationalAdminSigner)
          .changeDailyAllowance(testToken.address, toWei('20'), getCurrentTimeStamp({ additionalTime: 60 * 60 * 25 }));
        // This where we are exposed to token daily allowance
        expect((await proxyBridge.tokenAllowances(testToken.address)).dailyAllowance).to.equal(toWei('20'));
      });

      it('ARBITRARY_EOA', async () => {
        const { proxyBridge, testToken, defaultAdminSigner, arbitrarySigner } = await loadFixture(deployContracts);
        await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
        // Increase time by 60 secs
        await time.increase(60);
        // Revert txn if not by Admin or Operation wallet
        await expect(
          proxyBridge
            .connect(arbitrarySigner)
            .changeDailyAllowance(
              testToken.address,
              toWei('20'),
              getCurrentTimeStamp({ additionalTime: 60 * 60 * 25 }),
            ),
        ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
        expect((await proxyBridge.tokenAllowances(testToken.address)).dailyAllowance).to.equal(toWei('15'));
      });
    });
  });
});
