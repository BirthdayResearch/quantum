import { ethers, network } from 'hardhat';

import { BridgeProxy, BridgeV1__factory } from '../generated';

const TRANSACTION_FEE = 30;

export async function deployBridgeProxy({
  adminAddress,
  operationalAddress,
  relayerAddress,
  bridgeV1Address,
}: InputAddresses): Promise<BridgeProxy> {
  const { chainId } = network.config;
  const bridgeProxyContract = await ethers.getContractFactory('BridgeProxy');
  const encodedData = BridgeV1__factory.createInterface().encodeFunctionData('initialize', [
    'CAKE_BRIDGE',
    '0.1',
    // admin address
    adminAddress,
    // operational address
    operationalAddress,
    // relayer address
    relayerAddress,
    TRANSACTION_FEE,
  ]);
  const bridgeProxy = await bridgeProxyContract.deploy(bridgeV1Address, encodedData);
  await bridgeProxy.deployed();
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/BridgeProxy.sol:BridgeProxy ${bridgeProxy.address} ${BridgeV1Address} ${encodedData}`,
    );
  }

  return bridgeProxy;
}

interface InputAddresses {
  adminAddress: string;
  operationalAddress: string;
  relayerAddress: string;
  bridgeV1Address: string;
}
