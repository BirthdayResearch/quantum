import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class EthereumTransactionValidationPipe implements PipeTransform<string> {
  async transform(transactionHash: string) {
    const isTransactionHash =
      ethers.utils.isHexString(transactionHash) &&
      transactionHash.length === 66 &&
      transactionHash.slice(0, 2) === '0x';
    if (isTransactionHash === false) {
      throw new BadRequestException(`Invalid Ethereum transaction hash: ${transactionHash}`);
    }
    return transactionHash;
  }
}
