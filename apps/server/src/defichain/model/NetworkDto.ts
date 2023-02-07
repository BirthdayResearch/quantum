import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { IsEnum, IsOptional } from 'class-validator';

export class NetworkDto {
  @IsOptional()
  @IsEnum(EnvironmentNetwork)
  network: EnvironmentNetwork | undefined;
}
