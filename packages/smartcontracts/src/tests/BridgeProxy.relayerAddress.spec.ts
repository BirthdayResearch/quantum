import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';

import { deployContracts } from './testUtils/deployment';

describe('Relayer address change tests', () => {
  describe('DEFAULT_ADMIN_ROLE', () => {
    it('Successfully change the relayer address By Admin account', async () => {
      const { proxyBridge, defaultAdminSigner, operationalAdminSigner } = await loadFixture(deployContracts);
      // Change relayer address by Admin and Operational addresses
      expect(await proxyBridge.relayerAddress()).to.equal(defaultAdminSigner.address);
      await proxyBridge.connect(defaultAdminSigner).changeRelayerAddress(operationalAdminSigner.address);
      expect(await proxyBridge.relayerAddress()).to.equal(operationalAdminSigner.address);
    });

    it('Unable to change if new address is 0x0', async () => {
      const { proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts);
      // Test will fail with the error if input address is a dead address "0x0"
      expect(await proxyBridge.relayerAddress()).to.equal(defaultAdminSigner.address);
      await expect(
        proxyBridge.connect(defaultAdminSigner).changeRelayerAddress('0x0000000000000000000000000000000000000000'),
      ).to.be.revertedWithCustomError(proxyBridge, 'NON_ZERO_ADDRESS');
    });
  });

  describe('OPERATIONAL_ROLE', () => {
    it('Successfully change the relayer address by Operational address', async () => {
      const { proxyBridge, operationalAdminSigner, arbitrarySigner } = await loadFixture(deployContracts);
      // Change relayer address by Admin and Operational addresses
      await proxyBridge.connect(operationalAdminSigner).changeRelayerAddress(arbitrarySigner.address);
      expect(await proxyBridge.relayerAddress()).to.equal(arbitrarySigner.address);
    });

    it('Unable to change if new address is 0x0', async () => {
      const { proxyBridge, defaultAdminSigner, operationalAdminSigner } = await loadFixture(deployContracts);
      // Test will fail with the error if input address is a dead address "0x0"
      expect(await proxyBridge.relayerAddress()).to.equal(defaultAdminSigner.address);
      await expect(
        proxyBridge.connect(operationalAdminSigner).changeRelayerAddress('0x0000000000000000000000000000000000000000'),
      ).to.be.revertedWithCustomError(proxyBridge, 'NON_ZERO_ADDRESS');
    });
  });

  describe('ARBITRARY_EOA', () => {
    it('Unable to change relayer address if not Admin or Operations', async () => {
      const { proxyBridge, defaultAdminSigner, operationalAdminSigner, arbitrarySigner } = await loadFixture(
        deployContracts,
      );
      // Test will fail if the signer is neither admin or operational admin
      expect(await proxyBridge.relayerAddress()).to.equal(defaultAdminSigner.address);
      await expect(
        proxyBridge.connect(arbitrarySigner).changeRelayerAddress(operationalAdminSigner.address),
      ).to.be.revertedWithCustomError(proxyBridge, 'NON_AUTHORIZED_ADDRESS');
      expect(await proxyBridge.relayerAddress()).to.equal(defaultAdminSigner.address);
    });
  });

  describe('Emitted Events', () => {
    it('Successfully emitted the event on change of relayer address by Admin', async () => {
      const { proxyBridge, defaultAdminSigner, arbitrarySigner } = await loadFixture(deployContracts);
      // Event called RELAYER_ADDRESS_CHANGED should be emitted on Successful withdrawal by the Admin and Operational addresses only
      await expect(proxyBridge.connect(defaultAdminSigner).changeRelayerAddress(arbitrarySigner.address))
        .to.emit(proxyBridge, 'RELAYER_ADDRESS_CHANGED')
        .withArgs(defaultAdminSigner.address, arbitrarySigner.address);
    });
    it('Successfully emitted the event on change of relayer address by Operational', async () => {
      const { proxyBridge, defaultAdminSigner, operationalAdminSigner, arbitrarySigner } = await loadFixture(
        deployContracts,
      );
      // Event called RELAYER_ADDRESS_CHANGED should be emitted on Successful withdrawal by the Admin and Operational addresses only
      await expect(proxyBridge.connect(operationalAdminSigner).changeRelayerAddress(arbitrarySigner.address))
        .to.emit(proxyBridge, 'RELAYER_ADDRESS_CHANGED')
        .withArgs(defaultAdminSigner.address, arbitrarySigner.address);
    });
  });
});
