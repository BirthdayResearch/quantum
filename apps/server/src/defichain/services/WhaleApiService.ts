import { WhaleApiClient } from '@defichain/whale-api-client';
import { Injectable } from '@nestjs/common';
import { EnvironmentNetwork } from '@waveshq/walletkit-core/dist/api/environment';

import { WhaleApiClientProvider } from '../providers/WhaleApiClientProvider';

@Injectable()
export class WhaleApiService {
  constructor(private readonly clientProvider: WhaleApiClientProvider) {}

  getClient(network: EnvironmentNetwork = EnvironmentNetwork.MainNet): WhaleApiClient {
    return this.clientProvider.getClient(network);
  }
}
