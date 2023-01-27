import { DeFiAddress } from '@defichain/jellyfish-address';
import { CTransactionSegWit, Script,TransactionSegWit } from '@defichain/jellyfish-transaction';
import { P2WPKHTransactionBuilder } from '@defichain/jellyfish-transaction-builder';
import { Injectable } from '@nestjs/common';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';

import { WhaleApiClientProvider } from '../providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from '../providers/WhaleWalletProvider';
import { WhaleApiService } from './WhaleApiService';

@Injectable()
export class TransactionService {
  constructor(
    private readonly whaleWalletProvider: WhaleWalletProvider,
    private readonly clientProvider: WhaleApiClientProvider,
    private readonly whaleClient: WhaleApiService,
  ) {}

  // Generates a DeFiChain Transaction that will be broadcasted to the chain
  // Accepts a common method getTX so can be reused for all TX types
  async craftTransaction(
    network: EnvironmentNetwork,
    address: string,
    getTX: (from: Script, builder: P2WPKHTransactionBuilder, to?: Script) => TransactionSegWit,
  ): Promise<CTransactionSegWit> {
    const wallet = this.whaleWalletProvider.createWallet(network);
    const to = DeFiAddress.from(this.clientProvider.remapNetwork(network), address).getScript();

    const from = await wallet.getScript();
    const builder = wallet.withTransactionBuilder();
    return new CTransactionSegWit(getTX(from, builder, to));
  }

  // Broadcast signed transaction to DeFiChain
  async broadcastTransaction(
    network: EnvironmentNetwork,
    tx: CTransactionSegWit,
    retries: number = 0,
  ): Promise<string> {
    const client = this.whaleClient.getClient(network);
    try {
      return await client.rawtx.send({ hex: tx.toHex() });
    } catch (e) {
      // Known issue on DeFiChain, need to add retry on broadcast
      if (retries < 3) {
        return await this.broadcastTransaction(network, tx, retries + 1);
      }
      throw e;
    }
  }
}
