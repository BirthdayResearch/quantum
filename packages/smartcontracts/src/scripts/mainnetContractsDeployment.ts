import { bridgeImplementation } from './deployBridgeImplementation';
import { deployBridgeProxy } from './deployBridgeProxy';

require('dotenv').config({
  path: './.env',
});

// When deploying to MAINNET to `ADMIN_ADDRESS` needed
const ADMIN_ADDRESS = '';
// When deploying to MAINNET to `OPERATIONAL_ADDRESS` needed
const OPERATIONAL_ADDRESS = '';
// When deploying to MAINNET to `RELAYER_ADDRESS` needed
const RELAYER_ADDRESS = '';

// Run this script to deploy all contracts on mainnet.
// npx hardhat run --network hardhat ./scripts/mainnetContractsDeployment.ts

async function main() {
  const bridgeV1 = await bridgeImplementation();
  await deployBridgeProxy({
    adminAddress: ADMIN_ADDRESS,
    operationalAddress: OPERATIONAL_ADDRESS,
    relayerAddress: RELAYER_ADDRESS,
    bridgeV1Address: bridgeV1.address,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
