import { Inject, Injectable } from '@nestjs/common';
import { BigNumber, ethers } from 'ethers';
import { BridgeV1__factory } from 'smartcontracts';

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

  async getAllEventsFromBlockNumber(blockNumber: number, contractAddress: string): Promise<object[]> {
    const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
    const contract = new ethers.Contract(contractAddress, BridgeV1__factory.abi, this.ethersRpcProvider);
    const eventSignature = contract.filters.BRIDGE_TO_DEFI_CHAIN();
    const events = await contract.queryFilter(eventSignature, blockNumber, currentBlockNumber - 65);
    return events;
  }
}
