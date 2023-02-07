import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.getOrThrow('DATABASE_URL'),
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
