import { ethers } from 'hardhat';

import { TestToken } from '../generated';
import { verify } from './utils/verify';

export async function deployTestERC20({ name, symbol, decimal }: InputsForConstructor): Promise<TestToken> {
  const ERC20Factory = await ethers.getContractFactory('TestToken');
  const ERC20 = await ERC20Factory.deploy(name, symbol, decimal);
  await ERC20.deployTransaction.wait(6);
  console.log('Verifying...');
  await verify({ contractAddress: ERC20.address, args: [name, symbol, decimal] });
  console.log('Verified...');
  console.log(name, ' :', ERC20.address);
  return ERC20;
}

interface InputsForConstructor {
  name: string;
  symbol: string;
  decimal: number;
}
