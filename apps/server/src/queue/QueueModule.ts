import { Module } from '@nestjs/common';

import { WhaleApiClientProvider } from '../defichain/providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from '../defichain/providers/WhaleWalletProvider';
import { DeFiChainTransactionService } from '../defichain/services/DeFiChainTransactionService';
import { SendService } from '../defichain/services/SendService';
import { WhaleApiService } from '../defichain/services/WhaleApiService';
import { EVMTransactionConfirmerService } from '../ethereum/services/EVMTransactionConfirmerService';
import { EthersModule } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { QueueController } from './QueueController';
import { QueueService } from './QueueService';

@Module({
  controllers: [QueueController],
  providers: [
    QueueService,
    PrismaService,
    EVMTransactionConfirmerService,
    WhaleApiService,
    WhaleWalletProvider,
    WhaleApiClientProvider,
    SendService,
    DeFiChainTransactionService,
  ],
  imports: [EthersModule],
})
export class QueueModule {}
