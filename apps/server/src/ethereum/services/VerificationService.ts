import { Inject, Injectable } from '@nestjs/common';
import { BigNumber as EthBigNumber, ethers } from 'ethers';
import { BridgeV1__factory } from 'smartcontracts';

import { ETHERS_RPC_PROVIDER } from '../../modules/EthersModule';

export enum ContractType {
  instant = 'instant',
  queue = 'queue',
}

const contract = {
  [ContractType.instant]: {
    interface: BridgeV1__factory.abi,
    name: 'bridgeToDeFiChain',
    signature: 'bridgeToDeFiChain(bytes,address,uint256)',
  },
  // Todo : update to phase 2 contract when ready
  [ContractType.queue]: {
    interface: BridgeV1__factory.abi,
    name: 'bridgeToDeFiChain',
    signature: 'bridgeToDeFiChain(bytes,address,uint256)',
  },
};

export enum ErrorMsgTypes {
  InaccurateNameAndSignature = 'Decoded function name or signature is inaccurate',
  PendingTxn = 'Transaction is still pending',
  InaccurateContractAddress = 'Contract Address in the Transaction Receipt is inaccurate',
  RevertedTxn = 'Transaction Reverted',
}
export interface VerifyIfValidTxnDto {
  parsedTxnData?: {
    etherInterface: ethers.utils.Interface;
    parsedTxnData: ethers.utils.TransactionDescription;
  };
  errorMsg?: ErrorMsgTypes;
}

@Injectable()
export class VerificationService {
  constructor(@Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider) {}

  async verifyIfValidTxn(
    transactionHash: string,
    contractAddress: string,
    contractType: ContractType,
  ): Promise<VerifyIfValidTxnDto> {
    const [parsedTxnData, txReceipt] = await Promise.all([
      this.parseTxnHash(transactionHash, contractType),
      this.ethersRpcProvider.getTransactionReceipt(transactionHash),
    ]);

    // Sanity check that the decoded function name and signature are correct
    if (
      parsedTxnData.parsedTxnData.name !== contract[contractType].name ||
      parsedTxnData.parsedTxnData.signature !== contract[contractType].signature
    ) {
      return { errorMsg: ErrorMsgTypes.InaccurateNameAndSignature };
    }

    // if transaction is still pending
    if (txReceipt === null) {
      return { errorMsg: ErrorMsgTypes.PendingTxn };
    }

    // Sanity check that the contractAddress is accurate in the Transaction Receipt
    if (txReceipt.to !== contractAddress) {
      return { errorMsg: ErrorMsgTypes.InaccurateContractAddress };
    }

    // if transaction is reverted
    const isReverted = txReceipt.status === 0;
    if (isReverted === true) {
      return { errorMsg: ErrorMsgTypes.RevertedTxn };
    }

    // TODO: Validate the txns event logs here through this.ethersRpcProvider.getLogs()

    return { parsedTxnData };
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

  decodeTxnData({
    etherInterface,
    parsedTxnData,
  }: {
    etherInterface: ethers.utils.Interface;
    parsedTxnData: ethers.utils.TransactionDescription;
  }) {
    const fragment = etherInterface.getFunction(parsedTxnData.name);
    const params = parsedTxnData.args.reduce((res, param, i) => {
      let parsedParam = param;
      const isUint = fragment.inputs[i].type.indexOf('uint') === 0;
      const isInt = fragment.inputs[i].type.indexOf('int') === 0;
      const isAddress = fragment.inputs[i].type.indexOf('address') === 0;

      if (isUint || isInt) {
        const isArray = Array.isArray(param);

        if (isArray) {
          parsedParam = param.map((val) => EthBigNumber.from(val).toString());
        } else {
          parsedParam = EthBigNumber.from(param).toString();
        }
      }

      // Addresses returned by web3 are randomly cased so we need to standardize and lowercase all
      if (isAddress) {
        const isArray = Array.isArray(param);
        if (isArray) {
          parsedParam = param.map((_) => _.toLowerCase());
        } else {
          parsedParam = param.toLowerCase();
        }
      }
      return {
        ...res,
        [fragment.inputs[i].name]: parsedParam,
      };
    }, {});

    return {
      params,
      name: parsedTxnData.name,
    };
  }
}