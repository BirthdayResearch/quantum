import { Inject, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { BridgeV1__factory } from 'smartcontracts';

import { ETHERS_RPC_PROVIDER } from '../../modules/EthersModule';

@Injectable()
export class VerificationService {
  constructor(@Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider) {}

  async verifyIfValidTxn(transactionHash: string): Promise<boolean> {
    const { parsedTxnData } = await this.parseTxnHash(transactionHash);
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

  async parseTxnHash(transactionHash: string): Promise<{
    etherInterface: ethers.utils.Interface;
    parsedTxnData: ethers.utils.TransactionDescription;
  }> {
    const onChainTxnDetail = await this.ethersRpcProvider.getTransaction(transactionHash);
    const etherInterface = new ethers.utils.Interface(BridgeV1__factory.abi);
    const parsedTxnData = etherInterface.parseTransaction({
      data: onChainTxnDetail.data,
      value: onChainTxnDetail.value,
    });

    return { etherInterface, parsedTxnData };
  }
}
