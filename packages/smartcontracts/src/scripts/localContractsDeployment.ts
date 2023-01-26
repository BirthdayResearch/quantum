import { ethers } from 'hardhat';

import { TestToken } from '../generated';
import { toWei } from '../tests/testUtils/mathUtils';
import { bridgeImplementation } from './deployBridgeImplementation';
import { deployBridgeProxy, ProxyContract } from './deployBridgeProxy';
import { tokenDeployment } from './deployERC20';

// Run this script to deploy all contracts on local testnet, mint and approve the proxy contacts
// npx hardhat run --network hardhat ./scripts/localContractsDeployment.ts
export async function mintAndApproveTestTokensLocal(): Promise<ReturnContracts> {
  const accounts = await ethers.provider.listAccounts();
  const defaultAdminSigner = await ethers.getSigner(accounts[0]);
  const defaultOperationalSigner = await ethers.getSigner(accounts[1]);
  const bridgeV1Address = await bridgeImplementation();
  const bridgeProxy = await deployBridgeProxy({
    AdminAddress: defaultAdminSigner.address,
    OperationalAddress: defaultOperationalSigner.address,
    RelayerAddress: defaultAdminSigner.address,
    BridgeV1Address: bridgeV1Address.contractAddress,
  });
  const { usdtContract, usdcContract } = await tokenDeployment();

  // Minting 100_000 tokens to accounts[0]
  await usdtContract.mint(defaultAdminSigner.address, toWei('100000'));
  await usdcContract.mint(defaultAdminSigner.address, toWei('100000'));
  // Approving max token to `bridgeProxyAddress` by accounts[0]
  await usdtContract.approve(bridgeProxy.bridgeProxy.address, ethers.constants.MaxUint256);
  await usdcContract.approve(bridgeProxy.bridgeProxy.address, ethers.constants.MaxUint256);

  return { usdtContract, usdcContract, bridgeProxy };
}

interface ReturnContracts {
  usdtContract: TestToken;
  usdcContract: TestToken;
  bridgeProxy: ProxyContract;
}

mintAndApproveTestTokensLocal().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
