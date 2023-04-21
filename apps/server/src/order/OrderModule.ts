import { Module } from '@nestjs/common';

import { WhaleApiClientProvider } from '../defichain/providers/WhaleApiClientProvider';
import { WhaleWalletProvider } from '../defichain/providers/WhaleWalletProvider';
import { DeFiChainTransactionService } from '../defichain/services/DeFiChainTransactionService';
import { SendService } from '../defichain/services/SendService';
import { WhaleApiService } from '../defichain/services/WhaleApiService';
import { EVMTransactionConfirmerService } from '../ethereum/services/EVMTransactionConfirmerService';
import { EthersModule } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { OrderController } from './OrderController';
import { OrderService } from './OrderService';

@Module({
  controllers: [OrderController],
  providers: [
    OrderService,
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
export class OrderModule {}
