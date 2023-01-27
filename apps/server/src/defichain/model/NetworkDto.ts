import { EnvironmentNetwork } from '@waveshq/walletkit-core/dist/api/environment';
import { IsEnum, IsOptional } from 'class-validator';

export class NetworkDto {
  @IsOptional()
  @IsEnum(EnvironmentNetwork)
  network: EnvironmentNetwork | undefined;
}
