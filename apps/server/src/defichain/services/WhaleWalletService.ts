import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EnvironmentNetwork } from '@waveshq/walletkit-core/dist/api/environment';

import { WhaleWalletProvider } from '../providers/WhaleWalletProvider';

@Injectable()
export class WhaleWalletService {
  constructor(private readonly whaleWalletProvider: WhaleWalletProvider) {}

  async generateAddress(network: EnvironmentNetwork = EnvironmentNetwork.MainNet): Promise<string> {
    try {
      const wallet = this.whaleWalletProvider.createWallet(network);
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
