import { Inject, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { BridgeV1__factory } from 'smartcontracts';

import { ETHERS_RPC_PROVIDER } from '../../modules/EthersModule';

export enum ContractType {
  v1 = 'v1',
  v2 = 'v2',
}
const contract = {
  [ContractType.v1]: {
    interface: BridgeV1__factory.abi,
  },
  // Todo : update to phase 2 contract when ready
  [ContractType.v2]: {
    interface: BridgeV1__factory.abi,
  },
};

@Injectable()
export class VerificationService {
  constructor(@Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider) {}

  async verifyIfValidTxn(transactionHash: string, contractType: ContractType): Promise<boolean> {
    const { parsedTxnData } = await this.parseTxnHash(transactionHash, contractType);
    // Sanity check that the decoded function name and signature are correct
    if (
      parsedTxnData.name !== 'bridgeToDeFiChain' ||
      parsedTxnData.signature !== 'bridgeToDeFiChain(bytes,address,uint256)'
    ) {
      return false;
    }

    // TODO: Validate the txns event logs here through this.ethersRpcProvider.getLogs()

    return true;
  }

  async parseTxnHash(
    transactionHash: string,
    contractType: ContractType,
  ): Promise<{
    etherInterface: ethers.utils.Interface;
    parsedTxnData: ethers.utils.TransactionDescription;
  }> {
    const onChainTxnDetail = await this.ethersRpcProvider.getTransaction(transactionHash);
    const etherInterface = new ethers.utils.Interface(contract[contractType].interface);
    const parsedTxnData = etherInterface.parseTransaction({
      data: onChainTxnDetail.data,
      value: onChainTxnDetail.value,
    });

    return { etherInterface, parsedTxnData };
  }
}
