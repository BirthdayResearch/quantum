import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeV1, TestToken } from '../generated';
import { deployContracts } from './testUtils/deployment';
import { amountAfterFee, currentTimeStamp, toWei } from './testUtils/mathUtils';

// initMintAndSupport will mint to the EOA address and approve contractAddress.
// This is primarily to help avoid the repetition of code
async function initMintAndSupport(
  proxyBridge: BridgeV1,
  testToken: TestToken,
  eoaAddress: string,
  contractAddress: string,
  timeStamp?: number,
) {
  await testToken.mint(eoaAddress, toWei('100'));
  await testToken.approve(contractAddress, ethers.constants.MaxInt256);
  // Daily allowance amount set to 15 testToken
  await proxyBridge.addSupportedTokens(
    testToken.address,
    ethers.utils.parseEther('15'),
    timeStamp ? currentTimeStamp(timeStamp) : currentTimeStamp(),
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
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
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
      ).to.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
      // Current daily usage should be 15. Above txn didn't succeed
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(toWei('15'));
    });

    it('Successfully revert if sending ETHER along with ERC20 token', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // This txn should fail. User sending 10 ETH along with ERC20 token
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10'), {
          value: toWei('10'),
        }),
      ).to.revertedWithCustomError(proxyBridge, 'DO_NOT_SEND_ETHER_WITH_ERC20');
    });

    it('Successfully bridging after a day', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address, 60 * 60 * 24);
      // Testing with testToken (already added in supported token)
      // Daily allowance is 15. Should revert with the error if exceeding daily allowance
      // Current daily usage should be zero
      expect((await proxyBridge.tokenAllowances(testToken.address)).currentDailyUsage).to.equal(0);
      // Starting supporting token from time
      const allowanceStartTime = currentTimeStamp(60 * 60 * 24);
      // adding testToken as supported token with dailyAllowance of 10. Allowance start time would be an currentTimeStamp + 1 day.
      expect((await proxyBridge.tokenAllowances(testToken.address)).latestResetTimestamp).to.equal(allowanceStartTime);
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10')),
      ).to.revertedWithCustomError(proxyBridge, 'STILL_IN_CHANGE_ALLOWANCE_PERIOD');
      // Contract address should be Zero
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(0);
      // increasing time by 1 day.
      await time.increase(60 * 60 * 24);
      // Bridging 10 tokens
      await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10'));
      // Checking contract balance: should be 10 test tokens
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('10'));
    });
    describe('Emitted Events: ERC20', () => {
      it('Successfully bridging over multiple days', async () => {
        const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
        await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address, 60 * 60 * 24);
        // increasing time by 1 day.
        await time.increase(60 * 60 * 24);
        await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('8'));
        await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('7'));
        // Checking Contract balance - should be 15 Test token
        expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('15'));
        // Daily allowance set to 10. This tx should fail
        await expect(
          proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('2')),
        ).to.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
        // increasing time by 3 days.
        await time.increase(60 * 60 * 72);
        await proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('15'));
        // Checking contract balance: should be 30 test tokens
        expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('30'));
        await expect(
          proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('2')),
        ).to.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
        // increasing time by 23 hrs.
        await time.increase(60 * 60 * 23);
        await expect(
          proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10')),
        ).to.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
        // increasing time by an hr.
        await time.increase(60 * 60 * 1);
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        // Need to add to the timestamp of the previous block to match the next block the tx is mined in
        const expectedTimestamp = blockBefore.timestamp + 1;
        // Getting tx fee from the bridged contract.
        const txFee = await proxyBridge.transactionFee();
        // Calculating amount after tx fees
        const netAmountAfterFee = amountAfterFee(toWei('10'), txFee);
        // Bridging 14 testToken
        await expect(proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('10')))
          .to.emit(proxyBridge, 'BRIDGE_TO_DEFI_CHAIN')
          .withArgs(ethers.constants.AddressZero, testToken.address, netAmountAfterFee, expectedTimestamp);
        // Checking contract balance: should be 40 test tokens
        expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('40'));
        const allowance = await proxyBridge.tokenAllowances(testToken.address);
        // Checking daily allowance
        expect(allowance[1]).to.equal(toWei('15'));
        // Checking current daily usage
        expect(allowance[2]).to.equal(toWei('10'));
        // Checking the change allowance period
        expect(allowance[3]).to.equal(false);
      });
    });

    it('No deposit to DefiChain if in change allowance period', async () => {
      const { proxyBridge, testToken, defaultAdminSigner } = await loadFixture(deployContracts);
      await initMintAndSupport(proxyBridge, testToken, defaultAdminSigner.address, proxyBridge.address);
      // Checking if the inChangeAllowancePeriod is false
      expect((await proxyBridge.tokenAllowances(ethers.constants.AddressZero)).inChangeAllowancePeriod).to.equal(false);
      // Changing allowance from 15 to 20 for testToken
      await proxyBridge.changeDailyAllowance(testToken.address, toWei('20'), currentTimeStamp(60 * 60 * 25));
      // Check if the allowance has been changed to 20
      expect((await proxyBridge.tokenAllowances(testToken.address)).dailyAllowance).to.equal(toWei('20'));
      // Confirming inChangeAllowancePeriod is true
      expect((await proxyBridge.tokenAllowances(testToken.address)).inChangeAllowancePeriod).to.equal(true);
      // This txn should be revert with the error 'STILL_IN_CHANGE_ALLOWANCE_PERIOD'
      // Sending 11 Ether to the bridge
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, testToken.address, toWei('11')),
      ).to.be.revertedWithCustomError(proxyBridge, 'STILL_IN_CHANGE_ALLOWANCE_PERIOD');
    });
  });

  describe('Bridging ETH token', () => {
    it('Bridge request should revert before adding support for ETH token', async () => {
      const { proxyBridge } = await loadFixture(deployContracts);
      // This txn should be revert if no allowance added
      // Sending 1 Ether
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, ethers.constants.AddressZero, 0, {
          value: toWei('1'),
        }),
      ).to.revertedWithCustomError(proxyBridge, 'TOKEN_NOT_SUPPORTED');
    });

    it('Successfully revert if bridging amount exceeds daily allowance', async () => {
      const { proxyBridge } = await loadFixture(deployContracts);
      // Set Allowance to 10 ether
      await proxyBridge.addSupportedTokens(ethers.constants.AddressZero, toWei('10'), currentTimeStamp());
      // This txn should be revert with custom error 'EXCEEDS_DAILY_ALLOWANCE'
      // Sending 11 Ether to the bridge
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, ethers.constants.AddressZero, 0, {
          value: toWei('11'),
        }),
      ).to.revertedWithCustomError(proxyBridge, 'EXCEEDS_DAILY_ALLOWANCE');
    });
    describe('Emitted Events: ETH', () => {
      it('Successfully bridging to DefiChain', async () => {
        // set allowance to 10 Ether
        const { proxyBridge } = await loadFixture(deployContracts);
        await proxyBridge.addSupportedTokens(ethers.constants.AddressZero, toWei('10'), currentTimeStamp());
        // Getting timestamp
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        // This is the pervious block, need to add the other block to match the coming tx's block
        const timestampBefore = blockBefore.timestamp + 1;
        // Tx fee
        const txFee = await proxyBridge.transactionFee();
        // Calculating amount after tx fees
        const netAmountAfterFee = amountAfterFee(toWei('3'), txFee);
        // Emitting an event "BRIDGE_TO_DEFI_CHAIN"
        // Users sending ETH can put any "_amount". Only "value" amount will be counted
        await expect(
          proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, ethers.constants.AddressZero, toWei('5'), {
            value: toWei('3'),
          }),
        )
          .to.emit(proxyBridge, 'BRIDGE_TO_DEFI_CHAIN')
          .withArgs(ethers.constants.AddressZero, ethers.constants.AddressZero, netAmountAfterFee, timestampBefore);
        expect(await ethers.provider.getBalance(proxyBridge.address)).to.equal(toWei('3'));
      });
    });

    it('No Bridging to DefiChain if in change allowance period', async () => {
      const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
      // Checking if the inChangeAllowancePeriod is false
      expect(await (await proxyBridge.tokenAllowances(ethers.constants.AddressZero)).inChangeAllowancePeriod).to.equal(
        false,
      );
      // Set Allowance to 10 ether by admin address
      await proxyBridge
        .connect(defaultAdminSigner)
        .addSupportedTokens(ethers.constants.AddressZero, toWei('10'), currentTimeStamp());
      // Changing allowance to set the notInChangeAllowancePeriod to 'True'
      await proxyBridge
        .connect(defaultAdminSigner)
        .changeDailyAllowance(ethers.constants.AddressZero, toWei('15'), currentTimeStamp(60 * 60 * 25));
      // Check if the allowance has been changed to 15
      expect(await (await proxyBridge.tokenAllowances(ethers.constants.AddressZero)).dailyAllowance).to.equal(
        toWei('15'),
      );
      expect(await (await proxyBridge.tokenAllowances(ethers.constants.AddressZero)).inChangeAllowancePeriod).to.equal(
        true,
      );
      // This txn should be revert with the error 'STILL_IN_CHANGE_ALLOWANCE_PERIOD'
      // Sending 11 Ether to the bridge
      await expect(
        proxyBridge.bridgeToDeFiChain(ethers.constants.AddressZero, ethers.constants.AddressZero, 0, {
          value: toWei('11'),
        }),
      ).to.be.revertedWithCustomError(proxyBridge, 'STILL_IN_CHANGE_ALLOWANCE_PERIOD');
    });
  });
});
