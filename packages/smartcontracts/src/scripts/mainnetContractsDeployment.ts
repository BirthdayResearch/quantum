/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from 'hardhat';

import { bridgeImplementation } from './deployBridgeImplementation';
import { deployBridgeProxy } from './deployBridgeProxy';
import { deployTimelockController } from './deployTimelockController';

require('dotenv').config({
  path: './.env',
});

// when deploying, replace the following values with the correct ones
const minDelay = 259200; // 3 days
const TIMELOCK_ADMIN_ADDRESS = ''; // Multi sig wallet
const BRIDGE_WITHDRAW_ADDRESS = '0x17D6bb95cCF124324995F08204132cdf75048284'; // Multi sig wallet
const RELAYER_ADDRESS = '0x17D6bb95cCF124324995F08204132cdf75048284';
const TX_FEE_ADDRESS = '0x17D6bb95cCF124324995F08204132cdf75048284';
const FLUSH_ADDRESS = '0x17D6bb95cCF124324995F08204132cdf75048284';

// Run this script to deploy all contracts on sepolia.
// npx hardhat run --network sepolia ./scripts/mainnetContractsDeployment.ts --config hardhat.config.ts

async function main() {
  const bridgeV1 = await bridgeImplementation();
  await deployBridgeProxy({
    adminAddress: '0x7A5A990EBaC71e56538C9311A6E080fe6e6Cdf0A',
    withdrawAddress: BRIDGE_WITHDRAW_ADDRESS,
    relayerAddress: RELAYER_ADDRESS,
    bridgeV1Address: bridgeV1.address,
    txFeeAddress: TX_FEE_ADDRESS,
    flushReceiveAddress: FLUSH_ADDRESS,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
