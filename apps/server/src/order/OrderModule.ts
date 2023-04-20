import { Module } from '@nestjs/common';

import { EthersModule } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { OrderController } from './OrderController';
import { OrderService } from './OrderService';

@Module({
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
  imports: [EthersModule],
})
export class OrderModule {}
