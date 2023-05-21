import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@birthdayresearch/sticky-testcontainers';
import { ethers } from 'ethers';
import {
  BridgeV1,
  HardhatNetwork,
  HardhatNetworkContainer,
  StartedHardhatNetworkContainer,
  TestToken,
} from 'smartcontracts';

import { StartedDeFiChainStubContainer } from '../defichain/containers/DeFiChainStubContainer';
import { sleep } from '../helper/sleep';
import { BridgeContractFixture } from '../testing/BridgeContractFixture';
import { BridgeServerTestingApp } from '../testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from '../testing/TestingModule';

describe('get transaction from ethersRpcProvider', () => {
  let testing: BridgeServerTestingApp;

  let startedPostgresContainer: StartedPostgreSqlContainer;
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let bridgeContract: BridgeV1;
  let bridgeContractFixture: BridgeContractFixture;
  let musdcContract: TestToken;
  let validTxnHash: string;

  beforeAll(async () => {
    startedPostgresContainer = await new PostgreSqlContainer().start();
    startedHardhatContainer = await new HardhatNetworkContainer().start();
    hardhatNetwork = await startedHardhatContainer.ready();

    bridgeContractFixture = new BridgeContractFixture(hardhatNetwork);
    await bridgeContractFixture.setup();

    // Using the default signer of the container to carry out tests
    ({ bridgeProxy: bridgeContract, musdc: musdcContract } =
      bridgeContractFixture.contractsWithAdminAndOperationalSigner);

    const transactionCall = await bridgeContract.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      musdcContract.address,
      5,
    );
    validTxnHash = transactionCall.hash;

    const dynamicModule = TestingModule.register(
      buildTestConfig({
        defichain: { key: StartedDeFiChainStubContainer.LOCAL_MNEMONIC },
        startedHardhatContainer,
        testnet: { bridgeContractAddress: bridgeContract.address },
        startedPostgresContainer,
        usdcAddress: musdcContract.address,
      }),
    );

    testing = new BridgeServerTestingApp(dynamicModule);
    await testing.start();
  });

  afterAll(async () => {
    await startedPostgresContainer.stop();
    await testing.stop();
  });

  it('Should be able to get transaction details when transaction exist', async () => {
    await hardhatNetwork.generate(2);
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/transaction/${validTxnHash}`,
    });
    const data = JSON.parse(resp.body);
    expect(data.hash).toStrictEqual(validTxnHash);
  });

  it('should return null when unable to get transactionHash', async () => {
    await hardhatNetwork.generate(2);
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/transaction/0xde3a7314eb5cf8fab61ab80a6cc920c8aa41c06cd0161a7374167ba5cf145d98`,
    });
    const data = JSON.parse(resp.body);
    expect(data).toStrictEqual(null);
  });

  it('Should have an error when too many requests', async () => {
    await sleep(1 * 60 * 1000); // sleep for 1 minute to reset throttle

    let count = 1;
    while (count <= 35) {
      await testing.inject({
        method: 'GET',
        url: `/ethereum/transaction/${validTxnHash}`,
      });
      count += 1;
    }

    // should get throttling error on the 36th
    const resp = await testing.inject({
      method: 'GET',
      url: `/ethereum/transaction/${validTxnHash}`,
    });

    const data = JSON.parse(resp.body);
    expect(data.message).toStrictEqual('ThrottlerException: Too Many Requests');
  });
});
