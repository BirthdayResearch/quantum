import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeV1, TestToken } from '../generated';
import { deployContracts } from './testUtils/deployment';
import { amountAfterFee, getCurrentTimeStamp, toWei } from './testUtils/mathUtils';

// initMintAndSupport will mint to the EOA address and approve contractAddress.
// This is primarily to help avoid the repetition of code
async function initMintAndSupport(
  proxyBridge: BridgeV1,
  testToken: TestToken,
  eoaAddress: string,
  contractAddress: string,
  additionalTime: number,
) {
  await testToken.mint(eoaAddress, toWei('100'));
  await testToken.approve(contractAddress, ethers.constants.MaxInt256);
  // Daily allowance amount set to 15 testToken
  await proxyBridge.addSupportedTokens(
    testToken.address,
    ethers.utils.parseEther('15'),
    getCurrentTimeStamp({ additionalTime }),
  );
}
describe('EVM --> DeFiChain', () => {
  describe('Bridging ERC20 token', () => {
    it('Bridge request before adding support for ERC20 token', async () => {
      const { proxyBridge, testToken } = await loadFixture(deployContracts);
      // Will need to figure why DFI address On it's own failing Even when adding 0x and 0x00
      // @dev will look into later
      await expect(
        proxyBridge.bridgeToDeFiChain(
          ethers.utils.toUtf8Bytes('8defichainBurnAddressXXXXXXXdRQkSm'),
          testToken.address,
          toWei('10'),
        ),
      ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_NOT_SUPPORTED');
    });

    it('Successfully revert if bridging amount exceeds daily allowance', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address, 15);
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
    });

    it('Successfully revert if sending zero ERC20 token', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address, 15);
      // Increase time by 60 secs
      await time.increase(60);
      // This txn should fail. User sending 0 ERC20 along with ETHER. only checking the _amount not value
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, 0),
      ).to.be.revertedWithCustomError(proxyBridge, 'AMOUNT_CAN_NOT_BE_ZERO');
    });

    it('Successfully bridging after a day', async () => {
      const { proxyBridge, testToken, defaultAdminSigner, communityAddress } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address, 60 * 60 * 24);
      // Testing with testToken (already added in supported token)
      // Daily allowance is 15. Should revert with the error if exceeding daily allowance
      // Current daily usage should be zero
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(0);
      // Starting supporting token from time
      const allowanceStartTime = getCurrentTimeStamp({ additionalTime: 60 * 60 * 24 });
      // adding testToken as supported token with dailyAllowance of 10. Allowance start time would be an getCurrentTimeStamp + 1 day.
      expect((await proxyBridge.tokenAllowances(testToken.address)).latestResetTimestamp).to.equal(allowanceStartTime);
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10')),
      ).to.be.revertedWithCustomError(proxyBridge, 'STILL_IN_CHANGE_ALLOWANCE_PERIOD');
      // Contract address balance should be zero
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(0);
      // increasing time by 1 day.
      await time.increase(60 * 60 * 24);
      // Bridging 10 tokens
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10'));
      // Checking contract balance: should be 10 - txFee test tokens
      const txFee = await proxyBridge.transactionFee();
      const expectedBalance = amountAfterFee({ amount: toWei('10'), transactionFee: txFee });
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(expectedBalance);
      // Checking the community wallet balance
      expect(await testToken.balanceOf(communityAddress)).to.be.equal(toWei('10').sub(expectedBalance));
    });

    describe('Emitted Events: ERC20', () => {
      it('Successfully bridging over multiple days', async () => {
        const { proxyBridge, testToken, defaultAdminSigner, communityAddress } = await loadFixture(deployContracts);
        await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address, 60 * 60 * 24);
        // increasing time by 1 day.
        await time.increase(60 * 60 * 24);
        await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('8'));
        await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('7'));
        // Checking Contract balance - should be 15 - txFee Test token
        const txFee = await proxyBridge.transactionFee();
        let amount = toWei('15');
        const expectedBalanceOne = amountAfterFee({ amount, transactionFee: txFee });
        expect(await testToken.balanceOf(proxyBridge.address)).to.equal(expectedBalanceOne);
        let txFeeBalance = amount.sub(expectedBalanceOne);
        expect(await testToken.balanceOf(communityAddress)).to.equal(txFeeBalance);
        // Daily allowance set to 15 during setup. This tx should fail (8 + 7 + 2) > 15
        await expect(
          proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('2')),
        ).to.be.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
        // increasing time by 3 days.
        await time.increase(60 * 60 * 72);
        await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, amount);
        // Checking contract balance: should be 30 - txFee test tokens
        const expectedBalanceTwo = amountAfterFee({ amount, transactionFee: txFee });
        expect(await testToken.balanceOf(proxyBridge.address)).to.equal(expectedBalanceOne.add(expectedBalanceTwo));
        // Checking community balance
        txFeeBalance = txFeeBalance.add(amount.sub(expectedBalanceTwo));
        expect(await testToken.balanceOf(communityAddress)).to.equal(txFeeBalance);
        await expect(
          proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('2')),
        ).to.be.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
        // increasing time by 23 hrs.
        await time.increase(60 * 60 * 23);
        await expect(
          proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10')),
        ).to.be.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
        // increasing time by an hr.
        await time.increase(60 * 60 * 1);
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        // Need to add to the timestamp of the previous block to match the next block the tx is mined in
        const expectedTimestamp = blockBefore.timestamp + 1;
        // Getting tx fee from the bridged contract.
        // Calculating amount after tx fees
        amount = toWei('10');
        const expectedBalanceThree = amountAfterFee({ amount, transactionFee: txFee });
        // Bridging 10 testToken
        await expect(proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, amount))
          .to.emit(proxyBridge, 'BRIDGE_TO_DEFI_CHAIN')
          .withArgs(ethers.constants.AddressZero, testToken.address, expectedBalanceThree, expectedTimestamp);
        // Checking contract balance: should be 40 - txFees test tokens
        expect(await testToken.balanceOf(proxyBridge.address)).to.equal(
          expectedBalanceOne.add(expectedBalanceTwo.add(expectedBalanceThree)),
        );
        // Checking community wallet balance
        expect(await testToken.balanceOf(communityAddress)).to.equal(
          txFeeBalance.add(amount.sub(expectedBalanceThree)),
        );
        const allowance = await proxyBridge.tokenAllowances(testToken.address);
        // Checking daily allowance
        expect(allowance[1]).to.equal(toWei('15'));
        // Checking current daily usage
        expect(allowance[2]).to.equal(toWei('10'));
      });
    });

    it('No deposit to DefiChain if in change allowance period', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address, 15);
      // Changing allowance from 15 to 20 for testToken
      await proxyBridge.changeDailyAllowance(
        testToken.address,
        toWei('20'),
        getCurrentTimeStamp({ additionalTime: 60 * 60 * 25 }),
      );
      // Check if the allowance has been changed to 20
      expect((await proxyBridge.tokenAllowances(testToken.address)).dailyAllowance).to.equal(toWei('20'));
      // This txn should be revert with the error 'STILL_IN_CHANGE_ALLOWANCE_PERIOD'
      // Sending 11 Ether to the bridge
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('11')),
      ).to.be.revertedWithCustomError(proxyBridge, 'STILL_IN_CHANGE_ALLOWANCE_PERIOD');
    });
  });
});
