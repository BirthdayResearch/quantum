import { Module } from '@nestjs/common';

import { PrismaService } from '../PrismaService';
import { OrderBookController } from './OrderBookController';
import { OrderBookService } from './OrderBookService';

// exports the endpoint to the controller, inside AppModule.ts
@Module({
  providers: [OrderBookService, PrismaService],
  controllers: [OrderBookController],
})
export class OrderBookModule {}
