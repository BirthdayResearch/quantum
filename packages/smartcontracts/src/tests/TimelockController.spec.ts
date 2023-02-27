import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { BridgeV1, BridgeV1__factory, TimelockController } from '../generated';
import { deployContracts } from './testUtils/deployment';

const getRanHex = (size: Number) => {
  const result = [];
  const hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

  for (let n = 0; n < size; n += 1) {
    result.push(hexRef[Math.floor(Math.random() * 16)]);
  }
  return result.join('');
};

// one timelock controller for the operational role, which is to change the parameters
// another timelock controller for only admin role, which is to withdraw any amount they want

describe('Sanity tests for Timelock Controller', () => {
  describe('Test change the Tx Fee', async () => {
    let timelockController: TimelockController;
    let proxyBridge: BridgeV1;
    let defaultAdminSigner: SignerWithAddress;
    const ZERO_BYTES32 = `0x${'0'.repeat(64)}`;
    const firstRandomValue = `0x${getRanHex(64)}`;
    const BridgeV1Interface = BridgeV1__factory.createInterface();
    const callDataForChangeTxFee = BridgeV1Interface.encodeFunctionData('changeTxFee', [1000]);

    it('Schedule successfully', async () => {
      ({ proxyBridge, defaultAdminSigner } = await loadFixture(deployContracts));
      const TimelockControllerFactory = await ethers.getContractFactory('TimelockController');
      timelockController = await TimelockControllerFactory.deploy(
        // minDelay
        24 * 60 * 60,
        // list of proposers
        [defaultAdminSigner.address],
        // list of executors
        [defaultAdminSigner.address],
        // admin of the timelock contract, set it to zero so that configuration of roles
        // can only be done via timelock proposals
        ethers.constants.AddressZero,
      );
      // grant defaultAdminRole to the timelockController
      await proxyBridge.grantRole(ZERO_BYTES32, timelockController.address);
      // calculate the id of the operation
      const firstOperationId = await timelockController.hashOperation(
        proxyBridge.address,
        0,
        callDataForChangeTxFee,
        // predecessor to equal to 0, don't care about dependencies
        ZERO_BYTES32,
        // salt
        firstRandomValue,
      );
      // set delay so that can only execute after (next_block).timestamp + 25 * 60 * 60
      await expect(
        timelockController.schedule(
          proxyBridge.address,
          0,
          callDataForChangeTxFee,
          ZERO_BYTES32,
          firstRandomValue,
          25 * 60 * 60,
        ),
      )
        .to.emit(timelockController, 'CallScheduled')
        .withArgs(firstOperationId, 0, proxyBridge.address, 0, callDataForChangeTxFee, ZERO_BYTES32, 25 * 60 * 60);
    });

    it('Fail when executing too early', async () => {
      await expect(
        timelockController.execute(proxyBridge.address, 0, callDataForChangeTxFee, ZERO_BYTES32, firstRandomValue),
      ).to.revertedWith('TimelockController: operation is not ready');
    });

    it('Increase time and execute successfully ', async () => {
      // Mines a new block whose timestamp is 48 * 60 * 60 after the latest block's timestamp
      await time.increase(48 * 60 * 60);
      await timelockController.execute(proxyBridge.address, 0, callDataForChangeTxFee, ZERO_BYTES32, firstRandomValue);
      expect(await proxyBridge.transactionFee()).to.equal(1000);
      // calculate the id of the operation
      const firstOperationId = await timelockController.hashOperation(
        proxyBridge.address,
        0,
        callDataForChangeTxFee,
        ZERO_BYTES32,
        firstRandomValue,
      );
      expect(await timelockController.getTimestamp(firstOperationId)).to.equal(1);
    });

    it('Re-schedule an already registered operation ', async () => {
      await expect(
        timelockController.schedule(
          proxyBridge.address,
          0,
          callDataForChangeTxFee,
          ZERO_BYTES32,
          firstRandomValue,
          25 * 60 * 60,
        ),
      ).to.revertedWith('TimelockController: operation already scheduled');
    });
  });
});
