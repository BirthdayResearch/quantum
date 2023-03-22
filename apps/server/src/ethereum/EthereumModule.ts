import { CacheModule, Module } from '@nestjs/common';

import { WhaleApiClientProvider } from '../defichain/providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from '../defichain/providers/WhaleWalletProvider';
import { DeFiChainTransactionService } from '../defichain/services/DeFiChainTransactionService';
import { SendService } from '../defichain/services/SendService';
import { WhaleApiService } from '../defichain/services/WhaleApiService';
import { SemaphoreCache } from '../libs/caches/SemaphoreCache';
import { EthersModule } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { EthereumController } from './controllers/EthereumController';
import { StatsController } from './controllers/StatsController';
import { EthereumStatsService } from './services/EthereumStatsService';
import { EVMTransactionConfirmerService } from './services/EVMTransactionConfirmerService';

@Module({
  providers: [
    SendService,
    PrismaService,
    WhaleApiService,
    WhaleWalletProvider,
    WhaleApiClientProvider,
    DeFiChainTransactionService,
    EVMTransactionConfirmerService,
    EthereumStatsService,
    SemaphoreCache,
  ],
  controllers: [EthereumController, StatsController],
  imports: [EthersModule, CacheModule.register({ max: 10_000 })],
  exports: [EVMTransactionConfirmerService, EthereumStatsService],
})
export class EthereumModule {}
