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
    AdminAddress: ADMIN_ADDRESS,
    OperationalAddress: OPERATIONAL_ADDRESS,
    RelayerAddress: RELAYER_ADDRESS,
    BridgeV1Address: bridgeV1.contractAddress,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
