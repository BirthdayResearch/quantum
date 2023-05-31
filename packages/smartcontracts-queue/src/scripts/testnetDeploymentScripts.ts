import { ethers } from 'hardhat';

import { bridgeImplementation } from './deployBridgeImplementation';
import { deployBridgeProxy } from './deployBridgeProxy';
import { deployTestERC20 } from './deployTestERC20';

async function main() {
  const bridgeQueue = await bridgeImplementation();
  const accounts = await ethers.provider.listAccounts();

  const bridgeQueueProxy = await deployBridgeProxy({
    timelockContractAddress: accounts[0],
    coldWalletAddress: accounts[0],
    fee: '0',
    communityWalletAddress: accounts[0],
    bridgeQueueAddress: bridgeQueue.address,
  });
  const firstToken = await deployTestERC20({ name: 'MockUSDC', symbol: 'MUSDC' });
  const secondToken = await deployTestERC20({ name: 'MockUSDT', symbol: 'MUSDT' });
  const bridgeQueueFactory = await ethers.getContractFactory('BridgeQueue');
  const bridgeQueueProxyAttached = bridgeQueueFactory.attach(bridgeQueueProxy.address);
  // add support for tokens
  await bridgeQueueProxyAttached.addSupportedToken(firstToken.address);
  await bridgeQueueProxyAttached.addSupportedToken(secondToken.address);
  await bridgeQueueProxyAttached.addSupportedToken(ethers.constants.AddressZero);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
