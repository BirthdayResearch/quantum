import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class EthereumQueueStatusPipe<T extends Record<string, string>> implements PipeTransform {
  constructor(private enumType: T) {}

  transform(value: any): any {
    if (!value) return undefined;

    if (!Object.values(this.enumType).includes(value)) {
      throw new BadRequestException(
        `Invalid query parameter value. See the acceptable values: ${Object.keys(this.enumType)
          .map((key) => this.enumType[key])
          .join(', ')}`,
      );
    }

    return value;
  }
}
