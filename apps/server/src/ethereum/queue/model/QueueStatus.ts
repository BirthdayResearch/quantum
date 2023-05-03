import { QueueStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique,IsEnum, IsOptional } from 'class-validator';

export class GetQueueStatusDto {
  @IsOptional()
  @IsEnum(QueueStatus, {
    each: true,
    message: `Invalid status value. See the acceptable values: ${Object.values(QueueStatus).join(', ')}`,
  })
  @Transform(({ value }) => value?.split(',') || [])
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @ArrayUnique()
  status?: QueueStatus[];
}
