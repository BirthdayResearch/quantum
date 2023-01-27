import { Module } from '@nestjs/common';

import { StatsController } from './controllers/StatsController';
import { WhaleWalletController } from './controllers/WhaleWalletController';
import { WhaleApiClientProvider } from './providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from './providers/WhaleWalletProvider';
import { TransactionService } from './services/TransactionService';
import { WhaleApiService } from './services/WhaleApiService';
import { WhaleWalletService } from './services/WhaleWalletService';

@Module({
  providers: [WhaleApiClientProvider, WhaleApiService, WhaleWalletProvider, WhaleWalletService, TransactionService],
  controllers: [StatsController, WhaleWalletController],
  exports: [],
})
export class DeFiChainModule {}
