import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { QueueStatus } from '@prisma/client';

@Injectable()
export class EthereumQueueMultiStatusPipe<T extends Record<string, string>> implements PipeTransform {
  constructor(private enumType: T) {}

  transform(value: any): QueueStatus | undefined {
    if (!value) return undefined;

    const statusArray = value.split(',');

    statusArray.forEach((status: QueueStatus) => {
      if (!Object.values(this.enumType).includes(status)) {
        throw new BadRequestException(
          `Invalid query parameter value. See the acceptable values: ${Object.keys(this.enumType)
            .map((key) => this.enumType[key])
            .join(', ')}`,
        );
      }
    });

    return statusArray;
  }
}
