import { ethers } from 'hardhat';

// npx hardhat run --network goerli ./scripts/deployERC20.ts
const TOKEN_ADMIN_ADDRESS = '';
async function main() {
  const ERC20 = await ethers.getContractFactory('GoerliTestToken');
  const mockTokenUSDT = await ERC20.deploy('Mock USDT', 'MUSDT', TOKEN_ADMIN_ADDRESS);
  await mockTokenUSDT.deployed();
  console.log('Test token is deployed to ', mockTokenUSDT.address);
  console.log(
    `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/GoerliTestToken.sol:GoerliTestToken ${mockTokenUSDT.address} Test T ${TOKEN_ADMIN_ADDRESS}`,
  );
  const mockTokenUSDC = await ERC20.deploy('Mock USDC', 'MUSDC', TOKEN_ADMIN_ADDRESS);
  await mockTokenUSDC.deployed();
  console.log('Test token is deployed to ', mockTokenUSDC.address);
  console.log(
    `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/GoerliTestToken.sol:GoerliTestToken ${mockTokenUSDC.address} Test T ${TOKEN_ADMIN_ADDRESS}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
