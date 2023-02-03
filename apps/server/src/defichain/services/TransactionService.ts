import { DeFiAddress } from '@defichain/jellyfish-address';
import { CTransactionSegWit, Script, TransactionSegWit } from '@defichain/jellyfish-transaction';
import { P2WPKHTransactionBuilder } from '@defichain/jellyfish-transaction-builder';
import { Transaction } from '@defichain/whale-api-client/dist/api/transactions';
import { Injectable } from '@nestjs/common';
import { EnvironmentNetwork, isPlayground } from '@waveshq/walletkit-core';

import { WhaleApiClientProvider } from '../providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from '../providers/WhaleWalletProvider';
import { WhaleApiService } from './WhaleApiService';

const MAX_TIMEOUT = 300000;
const INTERVAL_TIME = 5000;

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
    getTX: (from: Script, builder: P2WPKHTransactionBuilder, to: Script) => Promise<TransactionSegWit>,
  ): Promise<CTransactionSegWit> {
    const wallet = this.whaleWalletProvider.createWallet(network);
    const to = DeFiAddress.from(this.clientProvider.remapNetwork(network), address).getScript();

    const from = await wallet.getScript();
    const builder = wallet.withTransactionBuilder();
    return new CTransactionSegWit(await getTX(from, builder, to));
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

  // Check if the transaction has been confirmed
  async waitForTxConfirmation(network: EnvironmentNetwork, id: string): Promise<Transaction> {
    const client = this.whaleClient.getClient(network);
    const initialTime = isPlayground(network) ? 5000 : 30000;
    let start = initialTime;

    return new Promise((resolve, reject) => {
      let intervalID: NodeJS.Timeout;
      const callTransaction = (): void => {
        client.transactions
          .get(id)
          .then((tx) => {
            if (intervalID !== undefined) {
              clearInterval(intervalID);
            }
            resolve(tx);
          })
          .catch((e) => {
            if (start >= MAX_TIMEOUT) {
              if (intervalID !== undefined) {
                clearInterval(intervalID);
              }
              reject(e);
            }
          });
      };
      setTimeout(() => {
        callTransaction();
        intervalID = setInterval(() => {
          start += INTERVAL_TIME;
          callTransaction();
        }, INTERVAL_TIME);
      }, initialTime);
    });
  }
}
