import { Module } from '@nestjs/common';

import { EthersModule } from '../../modules/EthersModule';
import { PrismaService } from '../../PrismaService';
import { VerificationService } from '../services/VerificationService';
import { QueueController } from './controllers/QueueController';
import { RefundController } from './controllers/RefundController';
import { QueueService } from './services/QueueService';
import { RefundService } from './services/RefundService';

@Module({
  providers: [PrismaService, RefundService, VerificationService, QueueService],
  controllers: [RefundController, QueueController],
  imports: [EthersModule],
})
export class QueueModule {}
