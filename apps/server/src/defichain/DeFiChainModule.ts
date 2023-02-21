import { CacheModule, Module } from '@nestjs/common';

import { EthereumModule } from '../ethereum/EthereumModule';
import { SemaphoreCache } from '../libs/caches/SemaphoreCache';
import { PrismaService } from '../PrismaService';
import { StatsController } from './controllers/StatsController';
import { WhaleWalletController } from './controllers/WhaleWalletController';
import { WhaleApiClientProvider } from './providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from './providers/WhaleWalletProvider';
import { DeFiChainTransactionService } from './services/DeFiChainTransactionService';
import { SendService } from './services/SendService';
import { WhaleApiService } from './services/WhaleApiService';
import { WhaleWalletService } from './services/WhaleWalletService';

@Module({
  imports: [CacheModule.register({ max: 10_000 }), EthereumModule],
  providers: [
    WhaleApiClientProvider,
    WhaleApiService,
    WhaleWalletProvider,
    WhaleWalletService,
    DeFiChainTransactionService,
    SemaphoreCache,
    PrismaService,
    SendService,
  ],
  controllers: [StatsController, WhaleWalletController],
  exports: [],
})
export class DeFiChainModule {}
