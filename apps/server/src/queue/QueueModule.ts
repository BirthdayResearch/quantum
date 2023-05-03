import { Module } from '@nestjs/common';

import { VerificationService } from '../ethereum/services/VerificationService';
import { EthersModule } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { QueueController } from './QueueController';
import { QueueService } from './QueueService';

@Module({
  controllers: [QueueController],
  providers: [PrismaService, VerificationService, QueueService],
  imports: [EthersModule],
})
export class QueueModule {}
