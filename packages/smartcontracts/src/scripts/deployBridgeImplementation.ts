import { ethers } from 'hardhat';

// npx hardhat run --network goerli ./scripts/deployBridgeImplementation.ts
async function main() {
  const BridgeV1 = await ethers.getContractFactory('BridgeV1');
  const bridgeV1 = await BridgeV1.deploy();
  await bridgeV1.deployed();
  console.log('Bridge implementation address is ', bridgeV1.address);
  console.log(
    `Verify on Etherscan: npx hardhat verify --network goerli --contract contracts/BridgeV1.sol:BridgeV1 ${bridgeV1.address}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
