import { WhaleApiClient } from '@defichain/whale-api-client';
import { Injectable } from '@nestjs/common';
import { EnvironmentNetwork, getJellyfishNetwork, newOceanOptions, newWhaleAPIClient } from '@waveshq/walletkit-core';

// TODO: To update Jellyfish to export this type
export type SupportedNetwork = 'mainnet' | 'testnet' | 'regtest' | 'devnet';

@Injectable()
export class WhaleApiClientProvider {
  private readonly clientCacheByNetwork: Map<EnvironmentNetwork, WhaleApiClient> = new Map();

  /**
   * Lazily initialises WhaleApiClients and caches them by network for performance.
   * @param network - the network to connect to
   */
  getClient(network: EnvironmentNetwork): WhaleApiClient {
    const client = this.clientCacheByNetwork.get(network);
    if (client !== undefined) {
      return client;
    }
    return this.createAndCacheClient(network);
  }

  remapNetwork(network: EnvironmentNetwork): SupportedNetwork {
    return getJellyfishNetwork(network).name;
  }

  private createAndCacheClient(network: EnvironmentNetwork): WhaleApiClient {
    const client = newWhaleAPIClient(newOceanOptions(network));
    this.clientCacheByNetwork.set(network, client);
    return client;
  }
}
