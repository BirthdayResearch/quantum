import { Module } from '@nestjs/common';

import { EthersModule } from '../../modules/EthersModule';
import { PrismaService } from '../../PrismaService';
import { QueueController } from './controllers/QueueController';
import { QueueService } from './services/QueueService';

@Module({
  providers: [PrismaService, QueueService],
  controllers: [QueueController],
  imports: [EthersModule],
})
export class QueueModule {}
