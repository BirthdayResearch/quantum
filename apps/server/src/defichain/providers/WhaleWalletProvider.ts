import { JellyfishWallet, WalletHdNode, WalletHdNodeProvider } from '@defichain/jellyfish-wallet';
import { MnemonicHdNodeProvider, MnemonicProviderData } from '@defichain/jellyfish-wallet-mnemonic';
import { WhaleApiClient } from '@defichain/whale-api-client';
import { WhaleWalletAccount, WhaleWalletAccountProvider } from '@defichain/whale-api-wallet';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentNetwork, getBip32Option, getJellyfishNetwork } from '@waveshq/walletkit-core';
import { WalletPersistenceDataI, WalletType } from '@waveshq/walletkit-ui';

import { SupportedNetwork } from '../model/NetworkDto';
import { WhaleApiService } from '../services/WhaleApiService';

@Injectable()
export class WhaleWalletProvider {
  constructor(private readonly whaleClient: WhaleApiService, private readonly configService: ConfigService) {}

  createWallet(network: SupportedNetwork = SupportedNetwork.mainnet) {
    const mappedNetwork = this.mapNetwork(network);
    const mnemonic = this.configService.get(`defichain.${network}`);
    const data = this.toData(mnemonic.split(' '), mappedNetwork);
    const provider = this.initProvider(data, mappedNetwork);

    const whaleApiClient = this.whaleClient.getClient(network);
    return this.initJellyfishWallet(provider, mappedNetwork, whaleApiClient).get(1);
  }

  private initProvider(
    data: WalletPersistenceDataI<MnemonicProviderData>,
    network: EnvironmentNetwork,
  ): MnemonicHdNodeProvider {
    if (data.type !== WalletType.MNEMONIC_UNPROTECTED || data.version !== 'v1') {
      throw new Error('Unexpected WalletPersistenceDataI');
    }

    const options = getBip32Option(network);
    return MnemonicHdNodeProvider.fromData(data.raw, options);
  }

  private toData(mnemonic: string[], network: EnvironmentNetwork): WalletPersistenceDataI<MnemonicProviderData> {
    const options = getBip32Option(network);
    const data = MnemonicHdNodeProvider.wordsToData(mnemonic, options);

    return {
      version: 'v1',
      type: WalletType.MNEMONIC_UNPROTECTED,
      raw: data,
    };
  }

  private initJellyfishWallet<HdNode extends WalletHdNode>(
    provider: WalletHdNodeProvider<HdNode>,
    network: EnvironmentNetwork,
    client: WhaleApiClient,
  ): JellyfishWallet<WhaleWalletAccount, HdNode> {
    const accountProvider = new WhaleWalletAccountProvider(client, getJellyfishNetwork(network));
    return new JellyfishWallet(provider, accountProvider);
  }

  private mapNetwork(network: SupportedNetwork | undefined): EnvironmentNetwork {
    switch (network) {
      case SupportedNetwork.local:
        return EnvironmentNetwork.LocalPlayground;
      case SupportedNetwork.mainnet:
        return EnvironmentNetwork.MainNet;
      case SupportedNetwork.regtest:
        return EnvironmentNetwork.RemotePlayground;
      case SupportedNetwork.testnet:
        return EnvironmentNetwork.TestNet;
      default:
        return EnvironmentNetwork.LocalPlayground;
    }
  }
}
