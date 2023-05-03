import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  },
  // Todo : update to phase 2 contract when ready
  [ContractType.queue]: {
    interface: BridgeV1__factory.abi,
  },
};

export enum ErrorMsg {
  InaccurateNameAndSignature = 'Decoded function name or signation is inaccurate',
  PendingTxn = 'Transaction is still pending',
  InaccurateContractAddress = 'Contract Address, decoded name, or signature is inaccurate',
}
export interface VerifyIfValidTxnDto {
  isValidTxn: boolean;
  ErrorMsg?: string;
}

@Injectable()
export class VerificationService {
  private contractAddress: string;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private configService: ConfigService,
  ) {
    this.contractAddress = this.configService.getOrThrow('ethereum.contracts.queueBridgeProxy.address');
  }

  async verifyIfValidTxn(transactionHash: string, contractType: ContractType): Promise<VerifyIfValidTxnDto> {
    const { parsedTxnData } = await this.parseTxnHash(transactionHash, contractType);
    const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);

    // Sanity check that the decoded function name and signature are correct
    if (
      parsedTxnData.name !== 'bridgeToDeFiChain' ||
      parsedTxnData.signature !== 'bridgeToDeFiChain(bytes,address,uint256)'
    ) {
      return { isValidTxn: false, ErrorMsg: ErrorMsg.InaccurateNameAndSignature };
    }

    // if transaction is still pending
    if (txReceipt === null) {
      return { isValidTxn: false, ErrorMsg: ErrorMsg.PendingTxn };
    }

    // Sanity check that the contractAddress, decoded name and signature are correct
    if (txReceipt.to !== this.contractAddress) {
      return { isValidTxn: false, ErrorMsg: ErrorMsg.InaccurateContractAddress };
    }

    // if transaction is reverted
    const isReverted = txReceipt.status === 0;
    if (isReverted === true) {
      throw new BadRequestException(`Transaction Reverted`);
    }

    // TODO: Validate the txns event logs here through this.ethersRpcProvider.getLogs()

    return { isValidTxn: true };
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
