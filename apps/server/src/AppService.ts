import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BigNumber, Contract, ethers } from 'ethers';
import { BridgeV1__factory } from 'smartcontracts';

import { ETHERS_RPC_PROVIDER } from './modules/EthersModule';
import { PrismaService } from './PrismaService';

@Injectable()
export class AppService {
  private contract: Contract;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.contract = new ethers.Contract(
      this.configService.getOrThrow('contract.bridgeProxy.testnetAddress'),
      BridgeV1__factory.abi,
      this.ethersRpcProvider,
    );
  }

  async getBlockHeight(): Promise<number> {
    return this.ethersRpcProvider.getBlockNumber();
  }

  async getBalance(address: string): Promise<BigNumber> {
    return this.ethersRpcProvider.getBalance(address);
  }

  async handleTransaction(transactionHash: string): Promise<boolean> {
    const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);
    const isReverted = txReceipt.status === 0;
    if (isReverted === true) {
      throw new HttpException('Transaction Reverted', HttpStatus.BAD_REQUEST);
    }
    const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
    const numberOfConfirmations = currentBlockNumber - txReceipt.blockNumber;

    const txHashFound = await this.prisma.bridgeEventTransactions.findFirst({
      where: {
        transactionHash,
      },
    });

    if (txHashFound === null) {
      if (numberOfConfirmations < 65) {
        await this.prisma.bridgeEventTransactions.create({
          data: {
            transactionHash,
            status: 'NOT_CONFIRMED',
          },
        });
        return false;
      }
      await this.prisma.bridgeEventTransactions.create({
        data: {
          transactionHash,
          status: 'CONFIRMED',
        },
      });
      return true;
    }

    if (numberOfConfirmations < 65) {
      return false;
    }

    await this.prisma.bridgeEventTransactions.update({
      where: {
        id: txHashFound?.id,
      },
      data: {
        status: 'CONFIRMED',
        updatedAt: new Date(),
      },
    });
    return true;
  }
}
