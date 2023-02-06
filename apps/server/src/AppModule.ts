import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { appConfig, DATABASE_URL, ENV_VALIDATION_SCHEMA } from './AppConfig';
import { AppController } from './AppController';
import { AppService } from './AppService';
import { DeFiChainModule } from './defichain/DeFiChainModule';
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
    EthersModule,
    DeFiChainModule,
    RouterModule.register([
      {
        path: 'defichain',
        module: DeFiChainModule,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DeFiChainModule,
    PrismaService,
    {
      provide: DATABASE_URL,
      useFactory: (cfg: ConfigService) => cfg.getOrThrow(DATABASE_URL),
      inject: [ConfigService],
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
