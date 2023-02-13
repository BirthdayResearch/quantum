import { Inject, Injectable } from '@nestjs/common';
import { BigNumber, ethers } from 'ethers';

import { ETHERS_RPC_PROVIDER } from './modules/EthersModule';

@Injectable()
export class AppService {
  constructor(@Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider) {}

  async getBlockHeight(): Promise<number> {
    return this.ethersRpcProvider.getBlockNumber();
  }

  async getBalance(address: string): Promise<BigNumber> {
    return this.ethersRpcProvider.getBalance(address);
  }
}
