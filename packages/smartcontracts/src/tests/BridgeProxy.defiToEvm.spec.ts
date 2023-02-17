import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeV1, TestToken } from '../generated';
import { deployContracts } from './testUtils/deployment';
import { getCurrentTimeStamp, toWei } from './testUtils/mathUtils';

describe('DeFiChain --> EVM', () => {
  let proxyBridge: BridgeV1;
  let testToken: TestToken;
  let testToken2: TestToken;
  let defaultAdminSigner: SignerWithAddress;
  let operationalAdminSigner: SignerWithAddress;
  let domainData: any;
  const eip712Types = {
    CLAIM: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'tokenAddress', type: 'address' },
    ],
  };

  describe('Test for ERC20', () => {
    beforeEach(async () => {
      ({ proxyBridge, testToken, testToken2, defaultAdminSigner, operationalAdminSigner } = await loadFixture(
        deployContracts,
      ));
      domainData = {
        name: 'QUANTUM_BRIDGE',
        version: '1.0',
        chainId: 1337,
        verifyingContract: proxyBridge.address,
      };
      // Minting 100 testToken to ProxyContract
      await testToken.mint(proxyBridge.address, toWei('100'));
      // Supporting testToken with hard cap of 15
      await proxyBridge.addSupportedTokens(testToken.address, toWei('15'));
    });

    it('Valid Signature', async () => {
      const eip712Data = {
        to: defaultAdminSigner.address,
        amount: toWei('10'),
        nonce: 0,
        deadline: ethers.constants.MaxUint256,
        tokenAddress: testToken.address,
      };

      const signature = await defaultAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
      // Checking Balance before claiming fund, should be 0
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(0);
      await proxyBridge.claimFund(
        defaultAdminSigner.address,
        toWei('10'),
        0,
        ethers.constants.MaxUint256,
        testToken.address,
        signature,
      );
      // Checking Balance after claiming fund, should be 10
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('10'));
    });

    it('Invalid Signature', async () => {
      const eip712Data = {
        to: operationalAdminSigner.address,
        amount: toWei('10'),
        nonce: 0,
        deadline: ethers.constants.MaxUint256,
        tokenAddress: testToken.address,
      };
      // Relayer address is defaultAdminSigner, if not signed by relayer address, txn should fail.
      const signature = await operationalAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
      await expect(
        proxyBridge.claimFund(
          operationalAdminSigner.address,
          toWei('10'),
          0,
          ethers.constants.MaxUint256,
          testToken.address,
          signature,
        ),
      ).to.be.revertedWithCustomError(proxyBridge, 'FAKE_SIGNATURE');
      // Checking Balance after Unsuccessfully claiming fund, should be 0
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(0);
    });

    it('Incorrect nonce', async () => {
      // Correct nonce should be Zero
      await expect(
        proxyBridge.claimFund(
          operationalAdminSigner.address,
          toWei('10'),
          1,
          ethers.constants.MaxUint256,
          testToken.address,
          '0x00',
        ),
      ).to.be.revertedWithCustomError(proxyBridge, 'INCORRECT_NONCE');
      // Checking Balance after Unsuccessfully claiming fund, should be 0
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(0);
    });

    it('Unsupported token', async () => {
      await expect(
        proxyBridge.claimFund(
          operationalAdminSigner.address,
          toWei('10'),
          0,
          ethers.constants.MaxUint256,
          testToken2.address,
          '0x00',
        ),
      ).to.be.revertedWithCustomError(proxyBridge, 'TOKEN_NOT_SUPPORTED');
      // Checking Balance after Unsuccessfully claiming fund, should be 0
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(0);
    });

    it('Successfully revert when claiming more ERC20 than available balance', async () => {
      const eip712Data = {
        to: defaultAdminSigner.address,
        amount: toWei('110'),
        nonce: 0,
        deadline: ethers.constants.MaxUint256,
        tokenAddress: testToken.address,
      };

      const signature = await defaultAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
      expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('100'));
      // This should revert because proxy contract has only 100 tokens
      await expect(
        proxyBridge.claimFund(
          defaultAdminSigner.address,
          toWei('110'),
          0,
          ethers.constants.MaxUint256,
          testToken.address,
          signature,
        ),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('Successfully revert when claim deadline expired', async () => {
      const eip712Data = {
        to: defaultAdminSigner.address,
        amount: toWei('10'),
        nonce: 0,
        deadline: ethers.constants.MaxUint256,
        tokenAddress: testToken.address,
      };

      const signature = await defaultAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
      // Checking Balance before claiming fund, should be 0
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(0);
      await expect(
        proxyBridge.claimFund(
          defaultAdminSigner.address,
          toWei('10'),
          0,
          // Deadline pass currentTime - 1 hr
          getCurrentTimeStamp() - 60 * 60 * 1,
          testToken.address,
          signature,
        ),
      ).to.be.revertedWithCustomError(proxyBridge, 'EXPIRED_CLAIM');
      // Checking Balance after claiming fund, should be 0
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('0'));
    });

    it('Successfully revert when claim more than available amount', async () => {
      const eip712Data = {
        to: defaultAdminSigner.address,
        amount: toWei('1000'),
        nonce: 0,
        deadline: ethers.constants.MaxUint256,
        tokenAddress: testToken.address,
      };

      const signature = await defaultAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
      // Checking Balance before claiming fund, should be 0
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(0);
      await expect(
        proxyBridge.claimFund(
          defaultAdminSigner.address,
          toWei('1000'),
          0,
          ethers.constants.MaxUint256,
          testToken.address,
          signature,
        ),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
      // Checking Balance after claiming fund, should be 0
      expect(await testToken.balanceOf(defaultAdminSigner.address)).to.equal(toWei('0'));
    });

    describe('Emitted events', () => {
      it('Successfully emitted event when claiming fund', async () => {
        const eip712Data = {
          to: defaultAdminSigner.address,
          amount: toWei('10'),
          nonce: 0,
          deadline: ethers.constants.MaxUint256,
          tokenAddress: testToken.address,
        };

        const signature = await defaultAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
        // Event called CLAIM_FUND should be emitted when Successfully claim fund
        await expect(
          proxyBridge.claimFund(
            defaultAdminSigner.address,
            toWei('10'),
            0,
            ethers.constants.MaxUint256,
            testToken.address,
            signature,
          ),
        )
          .to.emit(proxyBridge, 'CLAIM_FUND')
          .withArgs(testToken.address, defaultAdminSigner.address, toWei('10'));
      });
    });
  });

  describe('Test for ETH', () => {
    beforeEach(async () => {
      ({ proxyBridge, testToken, testToken2, defaultAdminSigner, operationalAdminSigner } = await loadFixture(
        deployContracts,
      ));
      domainData = {
        name: 'QUANTUM_BRIDGE',
        version: '1.0',
        chainId: 1337,
        verifyingContract: proxyBridge.address,
      };
      await defaultAdminSigner.sendTransaction({
        to: proxyBridge.address,
        value: toWei('100'),
      });
      // Supporting ether with hard cap of 15
      await proxyBridge.addSupportedTokens(ethers.constants.AddressZero, toWei('15'));
    });

    it('Valid Signature', async () => {
      const eip712Data = {
        to: defaultAdminSigner.address,
        amount: toWei('10'),
        nonce: 0,
        deadline: ethers.constants.MaxUint256,
        tokenAddress: ethers.constants.AddressZero,
      };
      const signature = await defaultAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
      const ethBalanceBeforeClaim = await ethers.provider.getBalance(defaultAdminSigner.address);
      const tx = await proxyBridge.claimFund(
        defaultAdminSigner.address,
        toWei('10'),
        0,
        ethers.constants.MaxUint256,
        ethers.constants.AddressZero,
        signature,
      );
      const receipt = await tx.wait();
      const ethBalanceAfterClaim = await ethers.provider.getBalance(defaultAdminSigner.address);
      // Checking Balance after claiming fund, should be 10
      expect(ethBalanceAfterClaim).to.equal(
        ethBalanceBeforeClaim.sub(receipt.gasUsed.mul(receipt.effectiveGasPrice)).add(toWei('10')),
      );
    });
  });
});
