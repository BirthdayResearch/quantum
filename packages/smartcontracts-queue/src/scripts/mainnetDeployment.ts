import { bridgeImplementation } from "./deployBridgeImplementation";
import { deployBridgeProxy } from "./deployBridgeProxy";

const TIMELOCK_CONTRACT_ADDRESS = "0x17D6bb95cCF124324995F08204132cdf75048284";
const COLD_WALLET_ADDRESS = "0x17D6bb95cCF124324995F08204132cdf75048284";
const FEE = "100";
const COMMUNITY_WALLET_ADDRESS = "0x17D6bb95cCF124324995F08204132cdf75048284";

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
