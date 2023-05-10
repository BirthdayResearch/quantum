import { Module } from '@nestjs/common';

import { PrismaService } from '../../PrismaService';
import { WhaleApiClientProvider } from '../providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from '../providers/WhaleWalletProvider';
import { DeFiChainTransactionService } from '../services/DeFiChainTransactionService';
import { WhaleApiService } from '../services/WhaleApiService';
import { QueueController } from './controllers/QueueController';
import { DfcQueueService } from './services/QueueService';

@Module({
  providers: [
    PrismaService,
    DfcQueueService,
    DeFiChainTransactionService,
    WhaleWalletProvider,
    WhaleApiClientProvider,
    WhaleApiService,
  ],
  controllers: [QueueController],
})
export class DfcQueueModule {}
