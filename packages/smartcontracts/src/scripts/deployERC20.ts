import { ethers, network } from 'hardhat';

import { TestToken } from '../generated';

// npx hardhat run --network goerli ./scripts/deployERC20.ts
export async function tokenDeployment(): Promise<TestTokens> {
  const { chainId } = network.config;
  const ERC20 = await ethers.getContractFactory('TestToken');

  const mockTokenBTC = await ERC20.deploy('MockBTC', 'MBTC'); // use {nonce:} if tx stuck
  await mockTokenBTC.deployed();
  console.log('Test MBTC token is deployed to ', mockTokenBTC.address);
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/TestToken.sol:TestToken ${mockTokenBTC.address} MockBTC MBTC`,
    );
  }

  const mockTokenUSDT = await ERC20.deploy('MockUSDT', 'MUSDT'); // use {nonce:} if tx stuck
  await mockTokenUSDT.deployed();
  console.log('Test MUSDT token is deployed to ', mockTokenUSDT.address);
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/TestToken.sol:TestToken ${mockTokenUSDT.address} MockUSDT MUSDT`,
    );
  }
  const mockTokenUSDC = await ERC20.deploy('MockUSDC', 'MUSDC');
  await mockTokenUSDC.deployed();
  console.log('Test MUSDC token is deployed to ', mockTokenUSDC.address);
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/TestToken.sol:TestToken ${mockTokenUSDC.address} MockUSDC MUSDC`,
    );
  }

  const mockTokenEUROC = await ERC20.deploy('MockEUROC', 'MEUROC');
  await mockTokenEUROC.deployed();
  console.log('Test MEUROC token is deployed to ', mockTokenEUROC.address);
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/TestToken.sol:TestToken ${mockTokenEUROC.address} MockEUROC MEUROC`,
    );
  }
  return {
    btcContract: mockTokenBTC,
    usdtContract: mockTokenUSDT,
    usdcContract: mockTokenUSDC,
    euroContract: mockTokenEUROC,
  };
}

interface TestTokens {
  btcContract: TestToken;
  usdtContract: TestToken;
  usdcContract: TestToken;
  euroContract: TestToken;
}
