import { bridgeImplementation } from "./deployBridgeImplementation";
import { deployBridgeProxy } from "./deployBridgeProxy";

const TIMELOCK_CONTRACT_ADDRESS = "";
const COLD_WALLET_ADDRESS = "";
const FEE = "";
const COMMUNITY_WALLET_ADDRESS = "";

// npx hardhat run --network sepolia ./scripts/mainnetDeployment.ts
async function main() {
  const bridgeQueue = await bridgeImplementation();
  await deployBridgeProxy({
    timelockContractAddress: TIMELOCK_CONTRACT_ADDRESS,
    coldWalletAddress: COLD_WALLET_ADDRESS,
    fee: FEE,
    communityWalletAddress: COMMUNITY_WALLET_ADDRESS,
    bridgeQueueAddress: bridgeQueue.address,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
