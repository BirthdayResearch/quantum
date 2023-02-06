import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { BigNumber, Contract, ethers, Event } from 'ethers';
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

  async getAllEventsFromBlockNumber(): Promise<Event[]> {
    const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
    const eventSignature = this.contract.filters.BRIDGE_TO_DEFI_CHAIN();
    const lastCheckedBlockNumber = await this.prisma.blockNumber.findFirst({
      where: {
        network: 'testnet',
      },
    });
    // update last checked block number to currentBlockNumber - 64 if currentBlockNumber-64 > blockNumber in database
    if (lastCheckedBlockNumber && currentBlockNumber - 64 > Number(lastCheckedBlockNumber.blockNumber)) {
      await this.prisma.blockNumber.update({
        where: {
          network: 'testnet',
        },
        data: {
          blockNumber: currentBlockNumber - 64,
        },
      });
      return this.contract.queryFilter(
        eventSignature,
        Number(lastCheckedBlockNumber.blockNumber),
        currentBlockNumber - 65,
      );
    }

    return [];
  }

  async initDatabase(body: Prisma.blockNumberCreateManyInput): Promise<Prisma.BatchPayload> {
    return this.prisma.blockNumber.createMany({ data: body });
  }

  async deleteDatabase(): Promise<Prisma.BatchPayload> {
    return this.prisma.blockNumber.deleteMany({});
  }
}
