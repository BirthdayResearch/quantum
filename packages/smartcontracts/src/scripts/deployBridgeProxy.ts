import { ethers } from 'hardhat';

import { BridgeV1__factory } from '../generated';

const ADMIN_ADDRESS = '0x5aB853A40b3b9A16891e8bc8e58730AE3Ec102b2';
const OPERATIONAL_ADDRESS = '0xb210F3bec24D034EF23fD1B3cDbE86a239527dF0';
const RELAYER_ADDRESS = '0x5aB853A40b3b9A16891e8bc8e58730AE3Ec102b2';
const TRANSACTION_FEE = 30;
const BRIDGE_IMPLEMENTATION_ADDRESS = '0xE029B5156c2e597c72f7c8D279411e1fD9a30126';
// npx hardhat run --network goerli ./scripts/deployBridgeProxy.ts
async function main() {
  const BridgeProxy = await ethers.getContractFactory('BridgeProxy');
  const encodedData = BridgeV1__factory.createInterface().encodeFunctionData('initialize', [
    'CAKE_BRIDGE',
    '0.1',
    // admin address
    ADMIN_ADDRESS,
    // operational address
    OPERATIONAL_ADDRESS,
    // relayer address
    RELAYER_ADDRESS,
    TRANSACTION_FEE,
  ]);
  const bridgeProxy = await BridgeProxy.deploy(BRIDGE_IMPLEMENTATION_ADDRESS, encodedData);
  await bridgeProxy.deployed();
  console.log(
    `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/BridgeProxy.sol:BridgeProxy ${bridgeProxy.address} ${BRIDGE_IMPLEMENTATION_ADDRESS} ${encodedData}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
