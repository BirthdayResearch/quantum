import { Module } from '@nestjs/common';

import { DeFiChainModule } from '../defichain/DeFiChainModule';
import { EthereumModule } from '../ethereum/EthereumModule';
import { PrismaService } from '../PrismaService';
import { RefundController } from './RefundController';
import { RefundService } from './RefundService';

@Module({
  controllers: [RefundController],
  providers: [RefundService, PrismaService],
  imports: [EthereumModule, DeFiChainModule],
})
export class RefundModule {}
