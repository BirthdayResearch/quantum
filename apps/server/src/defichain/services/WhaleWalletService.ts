import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { WhaleWalletProvider } from '../providers/WhaleWalletProvider';

@Injectable()
export class WhaleWalletService {
  constructor(private readonly whaleWalletProvider: WhaleWalletProvider) {}

  async generateAddress(): Promise<string> {
    try {
      const wallet = this.whaleWalletProvider.createWallet();
      return await wallet.getAddress();
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
