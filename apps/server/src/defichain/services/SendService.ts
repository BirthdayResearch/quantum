import { TransactionSegWit } from '@defichain/jellyfish-transaction';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import BigNumber from 'bignumber.js';

import { DeFiChainTransactionService } from './DeFiChainTransactionService';

@Injectable()
export class SendService {
  private network: EnvironmentNetwork;

  constructor(
    private readonly transactionService: DeFiChainTransactionService,
    private readonly configService: ConfigService,
  ) {
    this.network = configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
  }

  async send(address: string, token: { symbol: string; id: string; amount: BigNumber }): Promise<string> {
    const signedTX = await this.transactionService.craftTransaction(address, async (from, builder, to) => {
      let signed: TransactionSegWit;
      // To be able to send UTXO DFI
      if (token.symbol === 'DFI') {
        signed = await builder.utxo.send(token.amount, to, from);
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
                    amount: token.amount,
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
    return this.transactionService.broadcastTransaction(signedTX, 0);
  }
}
