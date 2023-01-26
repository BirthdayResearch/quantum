import { ethers, network } from 'hardhat';

import { BridgeProxy, BridgeV1__factory } from '../generated';

const TRANSACTION_FEE = 30;

export async function deployBridgeProxy({
  AdminAddress,
  OperationalAddress,
  RelayerAddress,
  BridgeV1Address,
}: InputAddresses): Promise<ProxyContract> {
  const { chainId } = network.config;
  const bridgeProxyContract = await ethers.getContractFactory('BridgeProxy');
  const encodedData = BridgeV1__factory.createInterface().encodeFunctionData('initialize', [
    'CAKE_BRIDGE',
    '0.1',
    // admin address
    AdminAddress,
    // operational address
    OperationalAddress,
    // relayer address
    RelayerAddress,
    TRANSACTION_FEE,
  ]);
  const bridgeProxy = await bridgeProxyContract.deploy(BridgeV1Address, encodedData);
  await bridgeProxy.deployed();
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/BridgeProxy.sol:BridgeProxy ${bridgeProxy.address} ${BridgeV1Address} ${encodedData}`,
    );
  }

  return { bridgeProxy };
}

interface InputAddresses {
  AdminAddress: string;
  OperationalAddress: string;
  RelayerAddress: string;
  BridgeV1Address: string;
}

export interface ProxyContract {
  bridgeProxy: BridgeProxy;
}
