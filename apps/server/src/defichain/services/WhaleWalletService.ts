import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../PrismaService';
import { WhaleWalletProvider } from '../providers/WhaleWalletProvider';

@Injectable()
export class WhaleWalletService {
  constructor(private readonly whaleWalletProvider: WhaleWalletProvider, private prisma: PrismaService) {}

  async generateAddress(): Promise<{ address: string }> {
    try {
      const lastIndex = await this.prisma.pathIndex.findFirst({
        orderBy: [{ index: 'desc' }],
      });
      const index = lastIndex?.index;
      const nextIndex = index ? index + 1 : 2;
      const wallet = this.whaleWalletProvider.createWallet(nextIndex);
      const address = await wallet.getAddress();
      await this.prisma.pathIndex.create({
        data: {
          index: nextIndex,
          address,
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
}
