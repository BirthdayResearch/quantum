import { ethers } from 'hardhat';

// npx hardhat run --network goerli ./scripts/deployERC20.ts
async function main() {
  const ERC20 = await ethers.getContractFactory('TestToken');
  const mockTokenUSDT = await ERC20.deploy('MockUSDT', 'MUSDT'); // use {nonce:} if tx stuck
  await mockTokenUSDT.deployed();
  console.log('Test token is deployed to ', mockTokenUSDT.address);
  console.log(
    `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/TestToken.sol:TestToken ${mockTokenUSDT.address} MockUSDT MUSDT`,
  );
  const mockTokenUSDC = await ERC20.deploy('MockUSDC', 'MUSDC');
  await mockTokenUSDC.deployed();
  console.log('Test token is deployed to ', mockTokenUSDC.address);
  console.log(
    `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/TestToken.sol:TestToken ${mockTokenUSDC.address} MockUSDC MUSDC`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// MUSDT Contract address 0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF - https://goerli.etherscan.io/address/0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF#code
// MUSDC Contract address 0xB200af2b733B831Fbb3d98b13076BC33F605aD58 - https://goerli.etherscan.io/address/0xB200af2b733B831Fbb3d98b13076BC33F605aD58#code
