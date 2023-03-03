import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupportedDFCTokenSymbols, SupportedEVMTokenSymbols } from 'src/AppConfig';

import { SettingsModel } from './SettingsInterface';

@Controller('settings')
export class SettingsController {
  constructor(private configService: ConfigService) {}

  @Get()
  public getSettings(): SettingsModel {
    const supportedDfcTokens = this.configService.getOrThrow('defichain.supportedTokens');
    const supportedEvmTokens = this.configService.getOrThrow('ethereum.supportedTokens');
    const settings = {
      defichain: {
        transferFee: this.configService.getOrThrow('defichain.transferFee') as `${number}`,
        supportedTokens: supportedDfcTokens.split(',') as Array<keyof typeof SupportedDFCTokenSymbols>,
      },
      ethereum: {
        transferFee: this.configService.getOrThrow('ethereum.transferFee') as `${number}`,
        supportedTokens: supportedEvmTokens.split(',') as Array<keyof typeof SupportedEVMTokenSymbols>,
      },
    };

    return settings;
  }
}
