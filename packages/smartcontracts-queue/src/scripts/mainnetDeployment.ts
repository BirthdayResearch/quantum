import { bridgeImplementation } from './deployBridgeImplementation';
import { deployBridgeProxy } from './deployBridgeProxy';

const TIMELOCK_CONTRACT_ADDRESS = '';
const COLD_WALLET_ADDRESS = '';
const FEE = '';
const COMMUNITY_WALLET_ADDRESS = '';
const SUPPORTED_TOKEN_ADDRESSES: string[] = [];

// for goerli deployment
// npx hardhat run --network goerli ./scripts/mainnetDeployment.ts --config hardhat.config.ts
// for mainnet deployment
// npx hardhat run --network mainnet ./scripts/mainnetDeployment.ts --config hardhat.config.ts
async function main() {
  const bridgeQueue = await bridgeImplementation();
  await deployBridgeProxy({
    timelockContractAddress: TIMELOCK_CONTRACT_ADDRESS,
    coldWalletAddress: COLD_WALLET_ADDRESS,
    fee: FEE,
    communityWalletAddress: COMMUNITY_WALLET_ADDRESS,
    bridgeQueueAddress: bridgeQueue.address,
    supportedTokenAddresses: SUPPORTED_TOKEN_ADDRESSES,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
