import { ethers } from 'hardhat';

import { bridgeImplementation } from './deployBridgeImplementation';
import { deployBridgeProxy } from './deployBridgeProxy';

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
  const bridgeQueueFactory = await ethers.getContractFactory('BridgeQueue');
  const bridgeQueueProxyAttached = bridgeQueueFactory.attach(bridgeQueueProxy.address);
  // add support for tokens
  const tokenAddresses = [
    '0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF',
    '0xB200af2b733B831Fbb3d98b13076BC33F605aD58',
    '0xD723D679d1A3b23d0Aafe4C0812f61DDA84fc043',
    '0x5ea4bbB3204522f3Ac65137D1E12027D9848231A',
    '0xe5442CC9BA0FF56E4E2Edae51129bF3A1b45d673',
  ];
  for (const tokenAddress of tokenAddresses) {
    await bridgeQueueProxyAttached.addSupportedToken(tokenAddress);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
