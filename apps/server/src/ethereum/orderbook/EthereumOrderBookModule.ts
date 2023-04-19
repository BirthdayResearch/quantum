import { Module } from '@nestjs/common';

import { PrismaService } from '../../PrismaService';
import { EthereumOrderBookController } from './EthereumOrderBookController';

// exports the endpoint to the controller, inside AppModule.ts
@Module({
  providers: [EthereumOrderBookController, PrismaService],
  controllers: [EthereumOrderBookController],
})
export class EthereumOrderBookModule {}
