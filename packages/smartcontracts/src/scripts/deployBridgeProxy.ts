import { ethers, network } from 'hardhat';

import { BridgeProxy, BridgeV1__factory } from '../generated';

const TRANSACTION_FEE = 10;

export async function deployBridgeProxy({
  adminAddress,
  withdrawAddress,
  relayerAddress,
  bridgeV1Address,
  txFeeAddress,
  flushReceiveAddress,
}: InputsForInitialization): Promise<BridgeProxy> {
  const { chainId } = network.config;
  const bridgeProxyContract = await ethers.getContractFactory('BridgeProxy');
  const encodedData = BridgeV1__factory.createInterface().encodeFunctionData('initialize', [
    // admin address, or timelock contract address
    adminAddress,
    // withdraw address
    withdrawAddress,
    // relayer address
    relayerAddress,
    // community wallet address
    txFeeAddress,
    TRANSACTION_FEE,
    flushReceiveAddress,
  ]);
  const bridgeProxy = await bridgeProxyContract.deploy(bridgeV1Address, encodedData);
  await bridgeProxy.deployed();
  console.log('Proxy Address: ', bridgeProxy.address);
  if (chainId !== 1337) {
    console.log(
      `To verify on Etherscan: npx hardhat verify --network goerli --contract contracts/BridgeProxy.sol:BridgeProxy ${bridgeProxy.address} ${bridgeV1Address} ${encodedData}`,
    );
  }

  return bridgeProxy;
}

interface InputsForInitialization {
  adminAddress: string;
  withdrawAddress: string;
  relayerAddress: string;
  bridgeV1Address: string;
  txFeeAddress: string;
  flushReceiveAddress: string;
}
