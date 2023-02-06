import {WhaleApiClient, WhaleApiClientOptions} from '@defichain/whale-api-client';
import {Injectable} from '@nestjs/common';

import {EnvironmentNetwork, getJellyfishNetwork, newOceanOptions, newWhaleAPIClient} from '@waveshq/walletkit-core';
import {ConfigService} from "@nestjs/config";

// TODO: To update Jellyfish to export this type
export type SupportedNetwork = 'mainnet' | 'testnet' | 'regtest' | 'devnet';

@Injectable()
export class WhaleApiClientProvider {
  private readonly clientCacheByNetwork: Map<EnvironmentNetwork, WhaleApiClient> = new Map();

  constructor(
      private configService: ConfigService,
  ) {
  }

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
    const localWhale = this.configService.getOrThrow('defichain.localWhaleURL');
    const oceanOptions = network === EnvironmentNetwork.LocalPlayground ? {
      url: localWhale,
      network: "regtest",
      version: "v0",
    } as WhaleApiClientOptions : newOceanOptions(network);
    const client = newWhaleAPIClient(oceanOptions);
    this.clientCacheByNetwork.set(network, client);
    return client;
  }
}
