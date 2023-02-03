import { fromAddress } from '@defichain/jellyfish-address';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Network } from '@prisma/client';
import { EnvironmentNetwork } from '@waveshq/walletkit-core/dist/api/environment';

import { Prisma } from '../../prisma/Client';
import { WhaleApiClientProvider } from '../providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from '../providers/WhaleWalletProvider';

@Injectable()
export class WhaleWalletService {
  constructor(
    private readonly whaleWalletProvider: WhaleWalletProvider,
    private readonly clientProvider: WhaleApiClientProvider,
  ) {}

  async generateAddress(
    refundAddress: string,
    network: EnvironmentNetwork = EnvironmentNetwork.MainNet,
  ): Promise<{ address: string }> {
    try {
      const decodedAddress = fromAddress(refundAddress, this.clientProvider.remapNetwork(network));
      if (decodedAddress === undefined) {
        throw new Error(`Invalid refund address for DeFiChain ${network}`);
      }
      const lastIndex = await Prisma.pathIndex.findFirst({
        where: {
          network,
        },
        orderBy: [{ index: 'desc' }],
      });
      const index = lastIndex?.index;
      const nextIndex = index ? index + 1 : 2;
      const wallet = this.whaleWalletProvider.createWallet(network, nextIndex);
      const address = await wallet.getAddress();
      await Prisma.pathIndex.create({
        data: {
          index: nextIndex,
          address,
          network,
          refundAddress,
        },
      });
      return { address };
    } catch (e: any) {
      // TODO: Improve error handling
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'There is a problem in generating an address',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }

  async getAddressDetails(
    address: string,
    network: EnvironmentNetwork = EnvironmentNetwork.MainNet,
  ): Promise<{ address: string; network: Network; refundAddress: string; createdAt: Date } | null> {
    try {
      const data = await Prisma.pathIndex.findFirst({
        where: {
          address,
          network,
        },
        select: {
          address: true,
          network: true,
          refundAddress: true,
          createdAt: true,
        },
      });
      if (!data) {
        throw new Error('Address detail not available');
      }
      return data;
    } catch (error) {
      // TODO: Improve error handling
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'There is a problem in fetching an address',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error as Error,
        },
      );
    }
  }
}
