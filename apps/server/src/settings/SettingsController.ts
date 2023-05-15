import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import {
  Erc20Token,
  Network,
  NetworkI,
  NetworkOptionsI,
  SupportedDFCTokenSymbols,
  SupportedEVMTokenSymbols,
  SupportedNetworkTokens,
} from 'src/AppConfig';

import { SettingsModel } from './SettingsInterface';

@Controller('settings')
export class SettingsController {
  constructor(private configService: ConfigService) {}

  @SkipThrottle()
  @Get()
  async getSettings(): Promise<SettingsModel> {
    const supportedTokens = this.getSupportedTokens();

    const settings = {
      defichain: {
        transferFee: this.configService.getOrThrow('defichain.transferFee') as `${number}`,
        supportedTokens: supportedTokens.defichain,
        network: this.configService.getOrThrow('defichain.network'),
      },
      ethereum: {
        transferFee: this.configService.getOrThrow('ethereum.transferFee') as `${number}`,
        supportedTokens: supportedTokens.ethereum,
      },
    };
    return settings;
  }

  @Get('bridgeSupportedTokens')
  @Throttle(35, 60)
  async getSupportedToken(): Promise<[NetworkI<Erc20Token>, NetworkI<string>]> {
    const supportedTokens = this.getSupportedTokens();
    return this.filterSupportedNetworkTokens(supportedTokens);
  }

  private getSupportedTokens(): {
    defichain: SupportedDFCTokenSymbols;
    ethereum: SupportedEVMTokenSymbols;
  } {
    const supportedDfcTokens = this.configService.getOrThrow('defichain.supportedTokens').split(',') as Array<
      keyof typeof SupportedDFCTokenSymbols
    >;
    const supportedEvmTokens = this.configService.getOrThrow('ethereum.supportedTokens').split(',') as Array<
      keyof typeof SupportedEVMTokenSymbols
    >;

    return { defichain: supportedDfcTokens, ethereum: supportedEvmTokens };
  }

  private filterSupportedNetworkTokens(supportedTokens: {
    defichain: Array<keyof typeof SupportedDFCTokenSymbols>;
    ethereum: Array<keyof typeof SupportedEVMTokenSymbols>;
  }): any {
    return SupportedNetworkTokens.map((network: NetworkOptionsI) => {
      const supportedNetworkTokens =
        network.name === Network.DeFiChain ? supportedTokens.defichain : supportedTokens.ethereum;

      const tokenMatcher = network.tokens.filter((token: any) => supportedNetworkTokens.includes(token.tokenA.symbol));

      return {
        ...network,
        tokens: tokenMatcher,
      };
    });
  }
}
