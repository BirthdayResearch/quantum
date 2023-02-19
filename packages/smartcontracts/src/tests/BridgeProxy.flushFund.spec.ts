import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployContracts } from './testUtils/deployment';
import { toWei } from './testUtils/mathUtils';

describe('Test flushFund functionalities', () => {
  it('Should flush the funds successfully when there is initial redundant funds', async () => {
    const { proxyBridge, testToken, testToken2, flushReceiveSigner, defaultAdminSigner } = await loadFixture(
      deployContracts,
    );
    const ERC20 = await ethers.getContractFactory('TestToken');
    const testToken3 = await ERC20.deploy('Test3', 'T3');
    // Supporting testToken with hard cap of 20
    await proxyBridge.addSupportedTokens(testToken.address, toWei('20'));
    // Supporting testToken2 with hard cap of 30
    await proxyBridge.addSupportedTokens(testToken2.address, toWei('30'));
    // Supporting testToken3 with hard cap of 40
    await proxyBridge.addSupportedTokens(testToken3.address, toWei('40'));
    // Supporting ether with hard cap of 60
    await proxyBridge.addSupportedTokens(ethers.constants.AddressZero, toWei('60'));
    // Minting tokens to proxy bridge
    await testToken.mint(proxyBridge.address, toWei('100'));
    await testToken2.mint(proxyBridge.address, toWei('100'));
    await testToken3.mint(proxyBridge.address, toWei('100'));
    await defaultAdminSigner.sendTransaction({
      to: proxyBridge.address,
      value: toWei('100'),
    });
    // Getting balance of respected tokens before calling `flushFund()`
    const balance1BeforeFlush = await testToken.balanceOf(flushReceiveSigner.address);
    const balance2BeforeFlush = await testToken2.balanceOf(flushReceiveSigner.address);
    const balance3BeforeFlush = await testToken3.balanceOf(flushReceiveSigner.address);
    const balanceETHBeforeFlush = await ethers.provider.getBalance(flushReceiveSigner.address);
    //
    await proxyBridge.flushFund();
    // Getting balance of respected tokens after calling `flushFund()`
    const balance1AfterFlush = await testToken.balanceOf(flushReceiveSigner.address);
    const balance2AfterFlush = await testToken2.balanceOf(flushReceiveSigner.address);
    const balance3AfterFlush = await testToken3.balanceOf(flushReceiveSigner.address);
    const balanceETHAfterFlush = await ethers.provider.getBalance(flushReceiveSigner.address);
    expect(balance1AfterFlush.sub(balance1BeforeFlush)).to.equal(toWei('80'));
    expect(balance2AfterFlush.sub(balance2BeforeFlush)).to.equal(toWei('70'));
    expect(balance3AfterFlush.sub(balance3BeforeFlush)).to.equal(toWei('60'));
    expect(balanceETHAfterFlush.sub(balanceETHBeforeFlush)).to.equal(toWei('40'));
  });

  it('Revert if changing `flushReceiveAddress` to 0x0', async () => {
    const { proxyBridge, flushReceiveSigner } = await loadFixture(deployContracts);
    expect(await proxyBridge.flushReceiveAddress()).to.be.equal(flushReceiveSigner.address);
    await expect(proxyBridge.changeFlushReceiveAddress(ethers.constants.AddressZero)).to.be.revertedWithCustomError(
      proxyBridge,
      'ZERO_ADDRESS',
    );
    expect(await proxyBridge.flushReceiveAddress()).to.be.equal(flushReceiveSigner.address);
  });

  describe('DEFAULT_ADMIN_ROLE', () => {
    it('Should be able to change `flushReceiveAddress`', async () => {
      const { proxyBridge, defaultAdminSigner, flushReceiveSigner, arbitrarySigner } = await loadFixture(
        deployContracts,
      );
      expect(await proxyBridge.flushReceiveAddress()).to.be.equal(flushReceiveSigner.address);
      await expect(proxyBridge.connect(defaultAdminSigner).changeFlushReceiveAddress(arbitrarySigner.address))
        .to.emit(proxyBridge, 'CHANGE_FLUSH_RECEIVE_ADDRESS')
        .withArgs(flushReceiveSigner.address, arbitrarySigner.address);
      expect(await proxyBridge.flushReceiveAddress()).to.be.equal(arbitrarySigner.address);
    });
  });

  describe('OPERATIONAL_ROLE', () => {
    it('Should be able to change `flushReceiveAddress`', async () => {
      const { proxyBridge, flushReceiveSigner, arbitrarySigner, operationalAdminSigner } = await loadFixture(
        deployContracts,
      );
      expect(await proxyBridge.flushReceiveAddress()).to.be.equal(flushReceiveSigner.address);
      await proxyBridge.connect(operationalAdminSigner).changeFlushReceiveAddress(arbitrarySigner.address);
      expect(await proxyBridge.flushReceiveAddress()).to.be.equal(arbitrarySigner.address);
    });
  });

  describe('ARBITRARY_EOA', () => {
    it('Revert when changing `flushReceiveAddress`', async () => {
      const { proxyBridge, defaultAdminSigner, flushReceiveSigner, arbitrarySigner } = await loadFixture(
        deployContracts,
      );
      expect(await proxyBridge.flushReceiveAddress()).to.be.equal(flushReceiveSigner.address);
      await expect(
        proxyBridge.connect(arbitrarySigner).changeFlushReceiveAddress(defaultAdminSigner.address),
      ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
      expect(await proxyBridge.flushReceiveAddress()).to.be.equal(flushReceiveSigner.address);
    });
  });
});
