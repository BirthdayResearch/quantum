import { SupportedDFCTokenSymbols, SupportedEVMTokenSymbols } from 'src/AppConfig';

interface Settings {
  transferFee: `${number}` | number;
  supportedTokens: Array<keyof typeof SupportedEVMTokenSymbols | keyof typeof SupportedDFCTokenSymbols>;
}

export interface SettingsModel {
  defichain: Settings;
  ethereum: Settings;
}
