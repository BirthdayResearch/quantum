import { Module } from '@nestjs/common';

import { EthersModule } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { CreateController } from './CreateController';
import { CreateService } from './CreateService';

@Module({
  controllers: [CreateController],
  providers: [CreateService, PrismaService],
  imports: [EthersModule],
})
export class CreateModule {}
