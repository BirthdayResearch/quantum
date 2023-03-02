import { ethers, network } from 'hardhat';

import { TimelockController } from '../generated';

export async function deployTimelockController({
  minDelay,
  proposers,
  executors,
  admin,
}: InputsForInitialization): Promise<TimelockController> {
  const { chainId } = network.config;
  const timelockControllerFactory = await ethers.getContractFactory('TimelockController');
  const timelockController = await timelockControllerFactory.deploy(minDelay, proposers, executors, admin);
  await timelockController.deployed();
  console.log('Timelock Controller Address: ', timelockController.address);
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/TimelockController.sol:TimelockController ${timelockController.address} ${minDelay} ${proposers} ${executors} ${admin}`,
    );
  }

  return timelockController;
}

interface InputsForInitialization {
  minDelay: ethers.BigNumber;
  proposers: string[];
  executors: string[];
  admin: string;
}
