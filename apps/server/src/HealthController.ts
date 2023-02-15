import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { PrismaHealthIndicator } from './health/PrismaHealth';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService, private prisma: PrismaHealthIndicator) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.prisma.isHealthy('database')]);
  }
}
