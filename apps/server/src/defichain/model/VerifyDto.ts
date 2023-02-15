import BigNumber from 'bignumber.js';
import { IsEnum, IsNumberString, IsString } from 'class-validator';

enum TokenSymbol {
  'BTC' = 'BTC',
  'USDT' = 'USDT',
  'USDC' = 'USDC',
  'ETH' = 'ETH',
}

export class VerifyObject {
  constructor(public readonly amount: BigNumber, public readonly address: string, public readonly symbol: TokenSymbol) {
    this.address = address;
    this.amount = amount;
    this.symbol = symbol;
  }
}

export class VerifyDto {
  @IsNumberString()
  amount: string;

  @IsString()
  address: string;

  @IsEnum(TokenSymbol)
  symbol: TokenSymbol;

  constructor(address: string, amount: string, symbol: TokenSymbol) {
    this.address = address;
    this.amount = amount;
    this.symbol = symbol;
  }

  toObj(): VerifyObject {
    return new VerifyObject(new BigNumber(this.amount), this.address, this.symbol);
  }
}
