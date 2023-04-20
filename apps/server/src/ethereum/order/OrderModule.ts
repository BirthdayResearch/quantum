import { Module } from '@nestjs/common';

import { WhaleApiClientProvider } from '../../defichain/providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from '../../defichain/providers/WhaleWalletProvider';
import { DeFiChainTransactionService } from '../../defichain/services/DeFiChainTransactionService';
import { SendService } from '../../defichain/services/SendService';
import { WhaleApiService } from '../../defichain/services/WhaleApiService';
import { EthersModule } from '../../modules/EthersModule';
import { PrismaService } from '../../PrismaService';
import { EVMTransactionConfirmerService } from '../services/EVMTransactionConfirmerService';
import { RefundController } from './controllers/RefundController';
import { RefundService } from './services/RefundService';

@Module({
  providers: [
    PrismaService,
    RefundService,
    EVMTransactionConfirmerService,
    WhaleApiService,
    WhaleWalletProvider,
    WhaleApiClientProvider,
    SendService,
    DeFiChainTransactionService,
  ],
  controllers: [RefundController],
  imports: [EthersModule],
})
export class OrderModule {}
