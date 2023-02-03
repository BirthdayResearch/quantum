import { TransactionSegWit } from '@defichain/jellyfish-transaction';
import { Injectable } from '@nestjs/common';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { WalletToken } from '@waveshq/walletkit-ui';
import BigNumber from 'bignumber.js';

import { TransactionService } from './TransactionService';

@Injectable()
export class SendService {
  constructor(private readonly transactionService: TransactionService) {}

  async send(
    address: string,
    amount: BigNumber,
    token: WalletToken,
    network: EnvironmentNetwork = EnvironmentNetwork.MainNet,
  ): Promise<string> {
    const signedTX = await this.transactionService.craftTransaction(network, address, async (from, builder, to) => {
      let signed: TransactionSegWit;
      // To be able to send UTXO DFI
      if (token.symbol !== 'DFI') {
        signed = await builder.utxo.send(amount, to, from);
      } else {
        // Rest of dTokens to use this tx type
        signed = await builder.account.accountToAccount(
          {
            from,
            to: [
              {
                script: to,
                balances: [
                  {
                    token: +token.id,
                    amount,
                  },
                ],
              },
            ],
          },
          from,
        );
      }
      return signed;
    });
    return this.transactionService.broadcastTransaction(network, signedTX, 0);
  }
}
