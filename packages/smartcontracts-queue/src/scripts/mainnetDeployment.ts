import { constants } from 'ethers';

import { bridgeImplementation } from './deployBridgeImplementation';
import { deployBridgeProxy } from './deployBridgeProxy';
import { deployTestERC20 } from './deployTestERC20';
import { deployTimelockController } from './deployTimelockController';

const COLD_WALLET_ADDRESS = '0x17D6bb95cCF124324995F08204132cdf75048284';
const FEE = '0x17D6bb95cCF124324995F08204132cdf75048284';
const COMMUNITY_WALLET_ADDRESS = '0x17D6bb95cCF124324995F08204132cdf75048284';
const TestNetMultiSigWallet = '0x04017A9bF51fCab070e8D496a9298e26f8dbc3bD';

// for sepolia deployment
// npx hardhat run --network sepolia ./scripts/mainnetDeployment.ts --config hardhat.config.ts
async function main() {
  const MUSDT = await deployTestERC20({ name: 'Mock USDT', symbol: 'MUSDT', decimal: 6 });
  const MUSDC = await deployTestERC20({ name: 'Mock USDC', symbol: 'MUSDC', decimal: 6 });
  const MEUROC = await deployTestERC20({ name: 'Mock EUROC', symbol: 'MEUROC', decimal: 6 });
  const MDFI = await deployTestERC20({ name: 'Mock DFI', symbol: 'MDFI', decimal: 8 });
  const MWBTC = await deployTestERC20({ name: 'Mock WBTC', symbol: 'MWBTC', decimal: 8 });
  const timelockContract = await deployTimelockController({
    minDelay: 3600,
    proposers: [TestNetMultiSigWallet],
    executors: [TestNetMultiSigWallet],
    admin: constants.AddressZero,
  });
  const SUPPORTED_TOKEN_ADDRESSES = [
    MUSDT.address,
    MUSDC.address,
    MEUROC.address,
    MDFI.address,
    MWBTC.address,
    constants.AddressZero,
  ];
  const bridgeQueue = await bridgeImplementation();
  await deployBridgeProxy({
    timelockContractAddress: timelockContract.address,
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
