import { ethers } from 'hardhat';

import { BridgeV1__factory } from '../generated';

const ADMIN_ADDRESS = '';
const OPERATIONAL_ADDRESS = '';
const RELAYER_ADDRESS = '';
const TRANSACTION_FEE = 30;
const BRIDGE_IMPLEMENTATION_ADDRESS = '';
// npx hardhat run --network goerli ./scripts/deployBridgeImplementation.ts
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
