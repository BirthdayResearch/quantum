import { Module } from '@nestjs/common';

import { EthersModule } from '../../modules/EthersModule';
import { PrismaService } from '../../PrismaService';
import { VerificationService } from '../services/VerificationService';
import { QueueController } from './controllers/QueueController';
import { QueueService } from './services/QueueService';

@Module({
  providers: [PrismaService, QueueService, VerificationService],
  controllers: [QueueController],
  imports: [EthersModule],
})
export class QueueModule {}
