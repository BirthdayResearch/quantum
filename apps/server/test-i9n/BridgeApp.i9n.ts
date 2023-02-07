import { ethers } from 'ethers';
import {
  BridgeV1,
  HardhatNetwork,
  HardhatNetworkContainer,
  StartedHardhatNetworkContainer,
  TestToken,
} from 'smartcontracts';

import { BridgeContractFixture } from './testing/BridgeContractFixture';
import { BridgeServerTestingApp } from './testing/BridgeServerTestingApp';
import { buildTestConfig, TestingModule } from './testing/TestingModule';

describe('Bridge Service Integration Tests', () => {
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let testing: BridgeServerTestingApp;
  let bridgeContract: BridgeV1;
  let bridgeContractFixture: BridgeContractFixture;
  let musdcContract: TestToken;

  beforeAll(async () => {
    startedHardhatContainer = await new HardhatNetworkContainer().start();
    hardhatNetwork = await startedHardhatContainer.ready();

    bridgeContractFixture = new BridgeContractFixture(hardhatNetwork);
    await bridgeContractFixture.setup();

    // Using the default signer of the container to carry out tests
    ({ bridgeProxy: bridgeContract, musdc: musdcContract } =
      bridgeContractFixture.contractsWithAdminAndOperationalSigner);

    // initialize config variables
    testing = new BridgeServerTestingApp(
      TestingModule.register(
        buildTestConfig({ startedHardhatContainer, testnet: { bridgeContractAddress: bridgeContract.address } }),
      ),
    );
    await testing.start();
  });

  afterAll(async () => {
    await hardhatNetwork.stop();
    await testing.stop();
  });

  it('Returns an array of confirmed events from a given block number', async () => {
    // Given a call to bridgeToDeFiChain
    await bridgeContract.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      musdcContract.address,
      ethers.utils.parseEther('5'),
    );
    await hardhatNetwork.generate(1);

    let currBlockRequest = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });
    const originalBlock = currBlockRequest.body;

    // When getting the current number of events
    let eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=${originalBlock}`,
    });

    // Then the array should be empty since the events have not been confirmed
    await expect(JSON.parse(eventsArray.body)).toHaveLength(0);

    // When generating the necessary number of confirmations
    await hardhatNetwork.generate(65);

    // Then there should be one event in the array from the previous bridgeToDeFiChain call
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=${originalBlock}`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(1);

    // Given another call to bridgeToDeFiChain again
    await bridgeContract.bridgeToDeFiChain(
      ethers.constants.AddressZero,
      musdcContract.address,
      ethers.utils.parseEther('5'),
    );
    await hardhatNetwork.generate(1);

    // When generating some blocks that do not meet the necessary number of confirmations
    await hardhatNetwork.generate(30);

    currBlockRequest = await testing.inject({
      method: 'GET',
      url: '/app/blockheight',
    });
    const nextBlock = currBlockRequest.body;

    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=${originalBlock}`,
    });
    // Then the array should still only have 1 event
    await expect(JSON.parse(eventsArray.body)).toHaveLength(1);

    // When generating the additional confirmations to hit the necessary number
    await hardhatNetwork.generate(35);

    // Then there should be two events in the array
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=${originalBlock}`,
    });
    await expect(JSON.parse(eventsArray.body)).toHaveLength(2);

    // When doing a sanity check from the nextBlock + 1 onwards
    eventsArray = await testing.inject({
      method: 'GET',
      url: `/app/getAllEventsFromBlockNumber?blockNumber=${nextBlock + 1}`,
    });

    // Then there should be no events
    await expect(JSON.parse(eventsArray.body)).toHaveLength(0);
  });
});
