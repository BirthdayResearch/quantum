import { ethers, network } from 'hardhat';

import { TestToken } from '../generated';

// npx hardhat run --network goerli ./scripts/deployERC20.ts
export async function tokenDeployment(): Promise<TestTokens> {
  const { chainId } = network.config;
  const ERC20 = await ethers.getContractFactory('TestToken');
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
  const mockTokenWBTC = await ERC20.deploy('MockWBTC', 'MWBTC');
  await mockTokenWBTC.deployed();
  console.log('Test MWBTC token is deployed to ', mockTokenWBTC.address);
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/TestToken.sol:TestToken ${mockTokenWBTC.address} MockBTC MWBTC`,
    );
  }
  const mockTokenEUROC = await ERC20.deploy('MockEUROC', 'MEUROC');
  await mockTokenEUROC.deployed();
  console.log('Test MEUROC token is deployed to ', mockTokenEUROC.address);
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/TestToken.sol:TestToken ${mockTokenEUROC.address} MockEURO MEUROC`,
    );
  }
  const tokenDFI = await ERC20.deploy('DFI', 'DFI');
  await tokenDFI.deployed();
  console.log('Test DFI token is deployed to ', tokenDFI.address);
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/TestToken.sol:TestToken ${tokenDFI.address} DFI DFI`,
    );
  }
  return {
    usdtContract: mockTokenUSDT,
    usdcContract: mockTokenUSDC,
    wbtcContract: mockTokenWBTC,
    eurocContract: mockTokenEUROC,
    dfiContract: tokenDFI,
  };
}

interface TestTokens {
  usdtContract: TestToken;
  usdcContract: TestToken;
  wbtcContract: TestToken;
  eurocContract: TestToken;
  dfiContract: TestToken;
}
