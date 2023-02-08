import { WhaleApiClient } from '@defichain/whale-api-client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NetworkContainer } from '../NetworkContainer';
import { WhaleApiClientProvider } from '../providers/WhaleApiClientProvider';

@Injectable()
export class WhaleApiService extends NetworkContainer {
  constructor(private readonly clientProvider: WhaleApiClientProvider, private configService: ConfigService) {
    super(configService);
  }

  getClient(): WhaleApiClient {
    return this.clientProvider.getClient(this.network);
  }
}
