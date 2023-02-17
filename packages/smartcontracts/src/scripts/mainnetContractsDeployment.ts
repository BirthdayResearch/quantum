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
// When deploying to MAINNET to `TX_FEE_ADDRESS` needed
const TX_FEE_ADDRESS = '';
// When deploying to MAINNET to `FLUSH_ADDRESS` needed
const FLUSH_ADDRESS = '';

// Run this script to deploy all contracts on mainnet.
// npx hardhat run --network mainnet ./scripts/mainnetContractsDeployment.ts

// Run this script to deploy all contracts on Goerli testnet.
// npx hardhat run --network goerli ./scripts/mainnetContractsDeployment.ts

async function main() {
  const bridgeV1 = await bridgeImplementation();
  await deployBridgeProxy({
    adminAddress: ADMIN_ADDRESS,
    operationalAddress: OPERATIONAL_ADDRESS,
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
