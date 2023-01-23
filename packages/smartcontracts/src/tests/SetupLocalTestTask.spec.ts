import { expect } from 'chai';
import { ethers, run } from 'hardhat';

import { BridgeV1__factory, TestToken__factory } from '../generated';

describe('SetupLocalTestTask', () => {
  it('should set up the expected local testnet state', async () => {
    // Given that the setupLocalTest task is run
    await run('setupLocalTestnet');
    // snapshot current time - potentially flaky, but not possible to get the exact timestamp
    // unless we return it from the task
    const expectedTimeStamp = Math.floor(Date.now() / 1000);

    // suppressing type error - method is actually properly typed
    // @ts-ignore
    const [eoaSigner] = await ethers.getSigners();
    const eoaAddress = eoaSigner.address;
    // since the tests are deterministic, the contract addresses are deterministic as well
    // we can technically return these from the task, but it's not worth the effort for now
    // if this becomes a problem, we'll need to return the addresses/contract instances from the task
    const musdtAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
    const musdcAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
    const bridgeProxyAddress = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318';

    const musdtContract = TestToken__factory.connect(musdtAddress, eoaSigner);
    const musdcContract = TestToken__factory.connect(musdcAddress, eoaSigner);
    // behind proxy, so we need to use the proxy address
    const bridgeContract = BridgeV1__factory.connect(bridgeProxyAddress, eoaSigner);

    // When checking the ERC20 balances of the EOA
    const musdtBalance = await musdtContract.balanceOf(eoaAddress);
    const musdcBalance = await musdcContract.balanceOf(eoaAddress);

    // Then the balances should be as expected
    expect(musdtBalance.eq(1_000_000_000)).to.equal(true);
    expect(musdcBalance.eq(1_000_000_000)).to.equal(true);

    // When checking the admin address of the bridge
    // Then the EOA account should have the admin role.
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    expect(await bridgeContract.hasRole(DEFAULT_ADMIN_ROLE, eoaAddress)).to.equal(true);

    // When checking the operational address of the bridge
    // Then the EOA account should have the operational role.
    const OPERATIONAL_ROLE = ethers.utils.solidityKeccak256(['string'], ['OPERATIONAL_ROLE']);
    expect(await bridgeContract.hasRole(OPERATIONAL_ROLE, eoaAddress)).to.equal(true);

    // When checking that MUSDT is supported on the bridge
    // Then the token should be supported
    expect(await bridgeContract.supportedTokens(musdtAddress)).to.equal(true);
    const musdtSupportedTokenInfo = await bridgeContract.tokenAllowances(musdtAddress);

    // And the token should have the expected reset time
    expect(musdtSupportedTokenInfo[0].eq(expectedTimeStamp)).to.equal(true);

    // And the token should have the expected daily allowance
    expect(musdtSupportedTokenInfo[1].eq(ethers.constants.MaxInt256)).to.equal(true);

    // When checking that MUSDC is supported on the bridge
    // Then the token should be supported
    expect(await bridgeContract.supportedTokens(musdcAddress)).to.equal(true);
    const musdcSupportedTokenInfo = await bridgeContract.tokenAllowances(musdcAddress);

    // And the token should have the expected reset time
    expect(musdcSupportedTokenInfo[0].eq(expectedTimeStamp)).to.equal(true);

    // And the token should have the expected daily allowance
    expect(musdcSupportedTokenInfo[1].eq(ethers.constants.MaxInt256)).to.equal(true);

    // When checking that bridgeToDeFiChain can be called with a MUSDT token
    // And provisioning the necessary approval
    await musdtContract.approve(bridgeProxyAddress, ethers.constants.MaxInt256);

    // Then the call should not revert
    await bridgeContract.bridgeToDeFiChain(ethers.constants.AddressZero, musdtAddress, 1);

    // And the EOA's balance of MUSDT should be reduced by 1
    expect((await musdtContract.balanceOf(eoaAddress)).eq(999_999_999)).to.eq(true);

    // When checking that bridgeToDeFiChain can be called with a MUSDC token
    // And provisioning the necessary approval
    await musdcContract.approve(bridgeProxyAddress, ethers.constants.MaxInt256);

    // Then the call should not revert
    await bridgeContract.bridgeToDeFiChain(ethers.constants.AddressZero, musdcAddress, 1);

    // And the EOA's balance of MUSDT should be reduced by 1
    expect((await musdcContract.balanceOf(eoaAddress)).eq(999_999_999)).to.eq(true);
  });
});
