import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeV1__factory, TestToken__factory } from '../generated';
import { mintAndApproveTestTokensLocal } from '../scripts/localContractsDeployment';
import { toWei } from './testUtils/mathUtils';

describe('SetupLocalTestTask', () => {
  it('should set up the expected local testnet state', async () => {
    // Given that the setupLocalTest task is run
    const { usdtContract, usdcContract, bridgeProxy } = await mintAndApproveTestTokensLocal();

    // suppressing type error - method is actually properly typed
    // @ts-ignore
    const [adminSigner, operationalSigner] = await ethers.getSigners();
    const adminAddress = adminSigner.address;

    const musdtContract = TestToken__factory.connect(usdtContract.address, adminSigner);
    const musdcContract = TestToken__factory.connect(usdcContract.address, adminSigner);
    // behind proxy, so we need to use the proxy address
    const proxyBridge = BridgeV1__factory.connect(bridgeProxy.bridgeProxy.address, adminSigner);

    // When checking the ERC20 balances of the EOA
    expect(await musdtContract.balanceOf(adminAddress)).to.equal(toWei('100000'));
    expect(await musdcContract.balanceOf(adminAddress)).to.equal(toWei('100000'));
    // Check if the accounts[0] has the admin role.
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    expect(await proxyBridge.hasRole(DEFAULT_ADMIN_ROLE, adminAddress)).to.equal(true);
    // Check if the relayer address is same as accounts[0]
    expect(adminAddress).to.be.equal(await proxyBridge.relayerAddress());
    // Check if the accounts[1] has the OPERATIONAL_ROLE.
    const OPERATIONAL_ROLE = ethers.utils.solidityKeccak256(['string'], ['OPERATIONAL_ROLE']);
    expect(await proxyBridge.hasRole(OPERATIONAL_ROLE, operationalSigner.address)).to.equal(true);
  });
});
