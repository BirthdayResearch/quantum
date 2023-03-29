import { ethers } from 'hardhat';

import { BridgeV1, TestToken } from '../generated';
import { toWei } from '../tests/testUtils/mathUtils';
import { bridgeImplementation } from './deployBridgeImplementation';
import { deployBridgeProxy } from './deployBridgeProxy';
import { tokenDeployment } from './deployERC20';

// Run this script to deploy all contracts on local testnet, mint and approve the proxy contacts
// npx hardhat run --network development ./scripts/localContractsDeployment.ts
export async function mintAndApproveTestTokensLocal(): Promise<ReturnContracts> {
  const accounts = await ethers.provider.listAccounts();
  // On local testNet this is the accounts[0]
  const defaultAdminSigner = await ethers.getSigner(accounts[0]);
  const eoaAddress = defaultAdminSigner.address;
  console.log('Admin address: ', eoaAddress);
  console.log('Relayer address: ', eoaAddress);
  // On local testNet this is the accounts[1]
  const defaultWithdrawSigner = await ethers.getSigner(accounts[1]);
  const withdrawSignerAddress = defaultWithdrawSigner.address;
  console.log('Withdraw address: ', withdrawSignerAddress);
  console.log('---------------------------------------------');
  const bridgeV1 = await bridgeImplementation();
  const bridgeProxy = await deployBridgeProxy({
    adminAddress: eoaAddress,
    withdrawAddress: withdrawSignerAddress,
    relayerAddress: eoaAddress,
    bridgeV1Address: bridgeV1.address,
    txFeeAddress: accounts[3],
    // flushReceiveAddress
    flushReceiveAddress: accounts[4],
  });
  const bridgeImplementationContract = bridgeV1.attach(bridgeProxy.address);
  const { btcContract, usdtContract, usdcContract, euroContract } = await tokenDeployment();

  // Minting 100_000 tokens to accounts[0]
  await usdtContract.mint(eoaAddress, toWei('100000'));
  await usdcContract.mint(eoaAddress, toWei('100000'));

  await btcContract.mint(bridgeProxy.address, toWei('10'));
  await usdcContract.mint(bridgeProxy.address, toWei('10'));
  await usdtContract.mint(bridgeProxy.address, toWei('10'));
  await euroContract.mint(bridgeProxy.address, toWei('10'));

  // Approving max token to `bridgeProxyAddress` by accounts[0]
  await btcContract.approve(bridgeProxy.address, ethers.constants.MaxUint256);
  await usdcContract.approve(bridgeProxy.address, ethers.constants.MaxUint256);
  await usdtContract.approve(bridgeProxy.address, ethers.constants.MaxUint256);
  await euroContract.approve(bridgeProxy.address, ethers.constants.MaxUint256);

  // Adding mUsdt and mUsdc as supported tokens
  await bridgeImplementationContract.addSupportedTokens(btcContract.address, ethers.constants.MaxUint256);
  await bridgeImplementationContract.addSupportedTokens(usdcContract.address, ethers.constants.MaxUint256);
  await bridgeImplementationContract.addSupportedTokens(usdtContract.address, ethers.constants.MaxUint256);
  await bridgeImplementationContract.addSupportedTokens(euroContract.address, ethers.constants.MaxUint256);

  return { btcContract, usdtContract, usdcContract, euroContract, bridgeImplementationContract };
}

interface ReturnContracts {
  btcContract: TestToken;
  euroContract: TestToken;
  usdtContract: TestToken;
  usdcContract: TestToken;
  bridgeImplementationContract: BridgeV1;
}

mintAndApproveTestTokensLocal().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
