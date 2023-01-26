import { ethers, network } from 'hardhat';

// npx hardhat run --network goerli ./scripts/deployBridgeImplementation.ts
export async function bridgeImplementation(): Promise<ContractAddress> {
  const { chainId } = network.config;
  const BridgeV1 = await ethers.getContractFactory('BridgeV1');
  const bridgeV1 = await BridgeV1.deploy();
  await bridgeV1.deployed();
  console.log('Bridge implementation address is ', bridgeV1.address);
  if (chainId !== 1337) {
    console.log(
      `Verify on Etherscan: npx hardhat verify --network goerli --contract contracts/BridgeV1.sol:BridgeV1 ${bridgeV1.address}`,
    );
  }
  return { contractAddress: bridgeV1.address };
}

export interface ContractAddress {
  contractAddress: string;
}
