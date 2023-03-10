import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { ConfigService } from '@nestjs/config';

import { BridgeServerTestingApp } from './BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from './TestingModule';

describe('Settings Controller Test', () => {
  let testing: BridgeServerTestingApp;
  let startedPostgresContainer: StartedPostgreSqlContainer;
  let config: ConfigService;

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();

    testing = new BridgeServerTestingApp(
      TestingModule.register(
        buildTestConfig({
          defichain: { transferFee: '0.003', supportedTokens: 'BTC,ETH,USDT,USDC,EUROC' },
          ethereum: { transferFee: '0', supportedTokens: 'WBTC,ETH,USDT,USDC,EUROC' },
          startedPostgresContainer,
        }),
      ),
    );

    const app = await testing.start();
    config = app.get(ConfigService);
  });

  afterAll(async () => {
    await testing.stop();
  });

  it('Settings service should return the correct app settings for both DeFiChain and Ethereum', async () => {
    const response = await testing.inject({
      method: 'GET',
      url: `/settings`,
    });
    const settings = JSON.parse(response.payload);
    const dfcSupportedTokens = config.get('SUPPORTED_DFC_TOKENS')?.split(',');
    const evmSupportedTokens = config.get('SUPPORTED_EVM_TOKENS')?.split(',');

    expect(settings).toMatchObject({
      defichain: {
        transferFee: config.get('DFC_FEE_PERCENTAGE'),
        supportedTokens: dfcSupportedTokens,
        network: 'Local',
      },
      ethereum: {
        transferFee: config.get('ETH_FEE_PERCENTAGE'),
        supportedTokens: evmSupportedTokens,
      },
    });
  });
});
