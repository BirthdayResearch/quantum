import { CacheModule, Module } from '@nestjs/common';

import { SemaphoreCache } from '../libs/caches/SemaphoreCache';
import { EthersModule } from '../modules/EthersModule';
import { QueueModule } from '../queue/QueueModule';
import { EthereumController } from './controllers/EthereumController';
import { StatsController } from './controllers/StatsController';
import { TransactionsController } from './controllers/TransactionsController';
import { EthereumStatsService } from './services/EthereumStatsService';
import { EthereumTransactionsService } from './services/EthereumTransactionsService';
import { EVMTransactionConfirmerService } from './services/EVMTransactionConfirmerService';
import { VerificationService } from './services/VerificationService';

@Module({
  providers: [
    EVMTransactionConfirmerService,
    EthereumStatsService,
    EthereumTransactionsService,
    VerificationService,
    SemaphoreCache,
    QueueModule,
  ],
  controllers: [EthereumController, StatsController, TransactionsController],
  imports: [EthersModule, CacheModule.register({ max: 10_000 }), QueueModule],
  exports: [EVMTransactionConfirmerService, EthereumStatsService],
})
export class EthereumModule {}
