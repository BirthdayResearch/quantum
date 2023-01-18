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
