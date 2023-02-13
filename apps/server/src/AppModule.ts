import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { appConfig, ENV_VALIDATION_SCHEMA } from './AppConfig';
import { AppController } from './AppController';
import { AppService } from './AppService';
import { DeFiChainModule } from './defichain/DeFiChainModule';
import { EthereumModule } from './ethereum/EthereumModule';
import { EthersModule } from './modules/EthersModule';
import { PrismaService } from './PrismaService';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: ENV_VALIDATION_SCHEMA,
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    EthereumModule,
    EthersModule,
    DeFiChainModule,
    RouterModule.register([
      {
        path: 'defichain',
        module: DeFiChainModule,
      },
      {
        path: 'ethereum',
        module: EthereumModule,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DeFiChainModule,
    PrismaService,
    EthereumModule,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
