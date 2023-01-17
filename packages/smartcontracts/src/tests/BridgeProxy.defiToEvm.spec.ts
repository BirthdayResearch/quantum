import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeV1, TestToken } from '../generated';
import { deployContracts } from './testUtils/deployment';
import { currentTimeStamp, toWei } from './testUtils/mathUtils';

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

  beforeEach(async () => {
    ({ proxyBridge, testToken, testToken2, defaultAdminSigner, operationalAdminSigner } = await loadFixture(
      deployContracts,
    ));
    domainData = {
      name: 'CAKE_BRIDGE',
      version: '0.1',
      chainId: 1337,
      verifyingContract: proxyBridge.address,
    };
    // Minting 100 testToken to ProxyContract
    await testToken.mint(proxyBridge.address, toWei('100'));
    // Adding testToken in supported token with daily allowance of 15 tokens
    await proxyBridge.addSupportedTokens(testToken.address, toWei('15'), currentTimeStamp());
  });

  it('Valid Signature - ERC20 token', async () => {
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

  it('Successfully revert when claiming fund - ERC20', async () => {
    const eip712Data = {
      to: defaultAdminSigner.address,
      amount: toWei('110'),
      nonce: 0,
      deadline: ethers.constants.MaxUint256,
      tokenAddress: testToken.address,
    };

    const signature = await defaultAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
    expect(await testToken.balanceOf(proxyBridge.address)).to.equal(toWei('100'));
    // This should revert with custom error 'NOT_ENOUGH_ETHEREUM'. Proxy contract has only 100 tokens
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

  it('Successfully revert when claiming fund - ETH', async () => {
    const eip712Data = {
      to: defaultAdminSigner.address,
      amount: toWei('15'),
      nonce: 0,
      deadline: ethers.constants.MaxUint256,
      tokenAddress: ethers.constants.AddressZero,
    };

    const signature = await defaultAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
    // Sending 10 ether to proxy contract
    await defaultAdminSigner.sendTransaction({ to: proxyBridge.address, value: toWei('10'), gasLimit: 210000 });
    expect(await ethers.provider.getBalance(proxyBridge.address)).to.equal(toWei('10'));
    // Setting ether dailyAllowance to 5. If not set, txn will revert with 'TOKEN_NOT_SUPPORTED()'
    await proxyBridge.addSupportedTokens(ethers.constants.AddressZero, toWei('5'), currentTimeStamp());
    // This should revert with custom error 'NOT_ENOUGH_ETHEREUM'
    await expect(
      proxyBridge.claimFund(
        defaultAdminSigner.address,
        toWei('15'),
        0,
        ethers.constants.MaxUint256,
        ethers.constants.AddressZero,
        signature,
      ),
    ).to.be.revertedWithCustomError(proxyBridge, 'NOT_ENOUGH_ETHEREUM');
  });

  describe('Emitted events', () => {
    it('Successfully emitted event when claiming fund - ERC20', async () => {
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

    it('Successfully emitted event when claiming fund - ETH', async () => {
      const eip712Data = {
        to: defaultAdminSigner.address,
        amount: toWei('8'),
        nonce: 0,
        deadline: ethers.constants.MaxUint256,
        tokenAddress: ethers.constants.AddressZero,
      };

      const signature = await defaultAdminSigner._signTypedData(domainData, eip712Types, eip712Data);
      expect(await ethers.provider.getBalance(proxyBridge.address)).to.equal('0');
      // Sending ether to proxy contract
      await defaultAdminSigner.sendTransaction({ to: proxyBridge.address, value: toWei('10'), gasLimit: 210000 });
      expect(await ethers.provider.getBalance(proxyBridge.address)).to.equal(toWei('10'));
      // Setting ether dailyAllowance to 5. If not set, txn will revert with 'TOKEN_NOT_SUPPORTED()'
      await proxyBridge.addSupportedTokens(ethers.constants.AddressZero, toWei('5'), currentTimeStamp());
      // Daily allowance set to 5 ether. User can withdraw any amount as long as signature valid and amount equal or less than available balance
      await expect(
        proxyBridge.claimFund(
          defaultAdminSigner.address,
          toWei('8'),
          0,
          ethers.constants.MaxUint256,
          ethers.constants.AddressZero,
          signature,
        ),
      )
        .to.emit(proxyBridge, 'CLAIM_FUND')
        .withArgs(ethers.constants.AddressZero, defaultAdminSigner.address, toWei('8'));
    });
  });
});
