import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

export const ETHERS_RPC_PROVIDER = 'ETHERS_RPC_PROVIDER';

@Module({
  providers: [
    {
      provide: ETHERS_RPC_PROVIDER,
      useFactory: (configService: ConfigService) =>
        // TODO: need to have a TESTNET_ETHERS_RPC_PROVIDER and MAINNET_ETHERS_RPC_PROVIDER
        new ethers.providers.StaticJsonRpcProvider(configService.getOrThrow('ethereum.testnet.rpcUrl')),
      inject: [ConfigService],
    },
  ],
  exports: [ETHERS_RPC_PROVIDER],
})
export class EthersModule {}
