import { ethers, network } from 'hardhat';

import { BridgeV1 } from '../generated';

// npx hardhat run --network goerli ./scripts/deployBridgeImplementation.ts
export async function bridgeImplementation(): Promise<Contract> {
  const { chainId } = network.config;
  const BridgeV1Contract = await ethers.getContractFactory('BridgeV1');
  const bridgeV1 = await BridgeV1Contract.deploy();
  await bridgeV1.deployed();
  console.log('Bridge implementation address is ', bridgeV1.address);
  if (chainId !== 1337) {
    console.log(
      `Verify on Etherscan: npx hardhat verify --network goerli --contract contracts/BridgeV1.sol:BridgeV1 ${bridgeV1.address}`,
    );
  }
  return { bridgeV1 };
}

export interface Contract {
  bridgeV1: BridgeV1;
}
