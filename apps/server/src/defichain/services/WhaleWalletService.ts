import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { SupportedNetwork } from '../model/NetworkDto';
import { WhaleWalletProvider } from '../providers/WhaleWalletProvider';

@Injectable()
export class WhaleWalletService {
  constructor(private readonly whaleWalletProvider: WhaleWalletProvider) {}

  async generateAddress(network: SupportedNetwork = SupportedNetwork.mainnet): Promise<string> {
    const wallet = this.whaleWalletProvider.createWallet(network);
    return wallet.getAddress().catch((error: Error) => {
      // TODO: Improve error handling
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'There is a problem in generating an address',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: error,
        },
      );
    });
  }
}
