import { Module } from '@nestjs/common';

import { EthersModule } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { EthereumController } from './controllers/EthereumController';
import { EVMTransactionConfirmerService } from './services/EVMTransactionConfirmerService';

@Module({
  providers: [EVMTransactionConfirmerService, PrismaService],
  controllers: [EthereumController],
  imports: [EthersModule],
  exports: [EVMTransactionConfirmerService],
})
export class EthereumModule {}
