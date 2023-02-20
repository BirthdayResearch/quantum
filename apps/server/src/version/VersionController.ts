import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { VersionModel } from './VersionInterface';

@Controller('version')
export class VersionController {
  constructor(private configService: ConfigService) {}

  @Get()
  public getVersion(): VersionModel {
    const version = this.configService.get<string>('APP_VERSION');
    return {
      v: version ?? '0.0.0',
    };
  }
}
