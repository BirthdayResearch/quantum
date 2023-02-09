import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { execSync } from 'child_process';

import { CustomErrorCodes } from '../../src/CustomErrorCodes';
import { Prisma } from '../../src/prisma/Client';
import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';
import { DeFiChainStubContainer, StartedDeFiChainStubContainer } from './containers/DeFiChainStubContainer';

describe('DeFiChain Verify fund Testing', () => {
  const container = new PostgreSqlContainer();
  let postgreSqlContainer: StartedPostgreSqlContainer;

  // Tests are slower because it's running 3 containers at the same time
  jest.setTimeout(3600000);
  let testing: BridgeServerTestingApp;
  let defichain: StartedDeFiChainStubContainer;
  const WALLET_ENDPOINT = `/defichain/wallet/`;
  const VERIFY_ENDPOINT = `${WALLET_ENDPOINT}verify`;
  const localMnemonicIndex2Address = 'bcrt1q0c78n7ahqhjl67qc0jaj5pzstlxykaj3lyal8g';

  beforeAll(async () => {
    postgreSqlContainer = await container
      .withDatabase('bridge')
      .withUsername('playground')
      .withPassword('playground')
      .withExposedPorts({
        container: 5432,
        host: 5432,
      })
      .start();
    // deploy migration
    execSync('pnpm run migration:deploy');

    defichain = await new DeFiChainStubContainer().start();
    const whaleURL = await defichain.getWhaleURL();
    testing = new BridgeServerTestingApp(
      TestingModule.register(
        buildTestConfig({
          defichain: { whaleURL, key: StartedDeFiChainStubContainer.LOCAL_MNEMONIC },
        }),
      ),
    );

    await testing.start();
  });

  afterAll(async () => {
    await testing.stop();
    await postgreSqlContainer.stop();
    await defichain.stop();
  });

  it('should throw error if symbol is not valid', async () => {
    const initialResponse = await testing.inject({
      method: 'POST',
      url: `${VERIFY_ENDPOINT}`,
      payload: {
        amount: '1',
        symbol: '_invalid_symbol_',
        address: localMnemonicIndex2Address,
      },
    });
    const response = JSON.parse(initialResponse.body);
    expect(response).toStrictEqual({ isValid: false, statusCode: CustomErrorCodes.TokenSymbolNotValid });
  });

  it('should throw error if address is invalid', async () => {
    const initialResponse = await testing.inject({
      method: 'POST',
      url: `${VERIFY_ENDPOINT}`,
      payload: {
        amount: '1',
        symbol: 'BTC',
        address: '_invalid_address_',
      },
    });
    const response = JSON.parse(initialResponse.body);
    expect(response).toStrictEqual({ isValid: false, statusCode: CustomErrorCodes.AddressNotValid });
  });

  it('should throw error if address is not found in db', async () => {
    const initialResponse = await testing.inject({
      method: 'POST',
      url: `${VERIFY_ENDPOINT}`,
      payload: {
        amount: '2',
        symbol: 'BTC',
        address: localMnemonicIndex2Address,
      },
    });
    const response = JSON.parse(initialResponse.body);
    expect(response).toStrictEqual({ isValid: false, statusCode: CustomErrorCodes.AddressNotFound });
  });

  it('should throw error if address has zero balance', async () => {
    // Generate address (index = 2)
    await testing.inject({
      method: 'GET',
      url: `${WALLET_ENDPOINT}generate-address`,
    });

    const initialResponse = await testing.inject({
      method: 'POST',
      url: `${VERIFY_ENDPOINT}`,
      payload: {
        amount: '3',
        symbol: 'BTC',
        address: localMnemonicIndex2Address,
      },
    });

    const response = JSON.parse(initialResponse.body);
    expect(response).toStrictEqual({ isValid: false, statusCode: CustomErrorCodes.IsZeroBalance });
  });

  // TODO(pierregee): to send address
  it.skip('should throw error if balance did not match with the amount', async () => {
    const initialResponse = await testing.inject({
      method: 'POST',
      url: `${VERIFY_ENDPOINT}`,
      payload: {
        amount: '3',
        symbol: 'BTC',
        address: localMnemonicIndex2Address,
      },
    });

    const response = JSON.parse(initialResponse.body);
    expect(response).toStrictEqual({ isValid: false, statusCode: CustomErrorCodes.BalanceNotMatched });
  });

  // TODO(pierregee): configure increase of throttle guard for testing
  it.skip('should throw error if address is not owned by the wallet', async () => {
    const randomAddress = 'bcrt1qg8m5rcgc9da0dk2dmj9zltvlc99s5qugs4nf2l';
    // Save a random valid address (not owned by the wallet)
    const data = {
      index: 2,
      address: randomAddress,
    };
    await Prisma.pathIndex.update({ where: { index: 2 }, data });

    const initialResponse = await testing.inject({
      method: 'POST',
      url: `${VERIFY_ENDPOINT}`,
      payload: {
        amount: '3',
        symbol: 'BTC',
        address: randomAddress,
      },
    });

    const response = JSON.parse(initialResponse.body);
    expect(response).toStrictEqual({ isValid: false, statusCode: CustomErrorCodes.AddressNotOwned });
  });
});
