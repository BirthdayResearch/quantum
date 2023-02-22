import { Module } from '@nestjs/common';

import { WhaleApiClientProvider } from '../defichain/providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from '../defichain/providers/WhaleWalletProvider';
import { DeFiChainTransactionService } from '../defichain/services/DeFiChainTransactionService';
import { SendService } from '../defichain/services/SendService';
import { WhaleApiService } from '../defichain/services/WhaleApiService';
import { EthersModule } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { EthereumController } from './controllers/EthereumController';
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
  ],
  controllers: [EthereumController],
  imports: [EthersModule],
  exports: [EVMTransactionConfirmerService],
})
export class EthereumModule {}
