import { Module } from '@nestjs/common';

import { VersionController } from './VersionController';

@Module({
  controllers: [VersionController],
})
export class VersionModule {}
