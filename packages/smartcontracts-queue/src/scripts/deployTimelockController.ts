import { ethers } from 'hardhat';

import { TimelockController } from '../generated';
import { verify } from './utils/verify';

export async function deployTimelockController({
  minDelay,
  proposers,
  executors,
  admin,
}: InputsForInitialization): Promise<TimelockController> {
  const TimelockControllerFactory = await ethers.getContractFactory('TimelockController');
  const timelockController = await TimelockControllerFactory.deploy(minDelay, proposers, executors, admin);
  await timelockController.deployTransaction.wait(6);
  console.log('Verifying...');
  await verify({ contractAddress: timelockController.address, args: [minDelay, proposers, executors, admin] });
  console.log('Verified...');
  console.log('Timelock Controller Address: ', timelockController.address);
  return timelockController;
}

interface InputsForInitialization {
  minDelay: ethers.BigNumber;
  proposers: string[];
  executors: string[];
  admin: string;
}
