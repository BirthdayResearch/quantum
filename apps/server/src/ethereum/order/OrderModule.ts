import { Module } from '@nestjs/common';

import { PrismaService } from '../../PrismaService';
import { OrderController } from './controllers/OrderController';
import { RefundController } from './controllers/RefundController';
import { OrderService } from './services/OrderService';
import { RefundService } from './services/RefundService';

@Module({
  providers: [PrismaService, RefundService, OrderService],
  controllers: [RefundController, OrderController],
})
export class OrderModule {}
