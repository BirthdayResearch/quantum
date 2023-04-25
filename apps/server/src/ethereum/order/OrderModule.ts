import { Module } from '@nestjs/common';

import { EthersModule } from '../../modules/EthersModule';
import { PrismaService } from '../../PrismaService';
import { VerificationService } from '../services/VerificationService';
import { RefundController } from './controllers/RefundController';
import { RefundService } from './services/RefundService';

@Module({
  providers: [PrismaService, RefundService, VerificationService],
  controllers: [RefundController],
  imports: [EthersModule],
})
export class OrderModule {}
