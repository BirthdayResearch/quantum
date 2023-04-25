import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import {
  BridgeOrderBook,
  BridgeOrderBook__factory,
  BridgeOrderBookProxy__factory,
  TestToken,
} from "../../generated";

export async function deployContracts(): Promise<BridgeOrderBookDeploymentResult> {
  const accounts = await ethers.provider.listAccounts();
  const defaultAdminSigner = await ethers.getSigner(accounts[0]);
  const coldWalletSigner = await ethers.getSigner(accounts[1]);
  const communityWalletSigner = await ethers.getSigner(accounts[2]);
  const arbitrarySigner = await ethers.getSigner(accounts[3]);
  const BridgeOrderBookFactory = await ethers.getContractFactory(
    "BridgeOrderBook"
  );
  const bridgeOrderBook = await BridgeOrderBookFactory.deploy();
  await bridgeOrderBook.deployed();
  const BridgeOrderBookProxyFactory = await ethers.getContractFactory(
    "BridgeOrderBookProxy"
  );
  // deployment arguments for the Proxy contract
  const encodedData =
    BridgeOrderBook__factory.createInterface().encodeFunctionData(
      "initialize",
      [
        // default admin address
        accounts[0],
        // cold wallet
        accounts[1],
        // 0%
        0,
        // communityWalletAddress
        accounts[2],
      ]
    );
  const bridgeProxy = await BridgeOrderBookProxyFactory.deploy(
    bridgeOrderBook.address,
    encodedData
  );
  await bridgeProxy.deployed();
  const proxyBridge = BridgeOrderBookFactory.attach(bridgeProxy.address);
  // Deploying ERC20 tokens
  const ERC20 = await ethers.getContractFactory("TestToken");
  const testToken = await ERC20.deploy("Test", "T");
  const testToken2 = await ERC20.deploy("Test2", "T2");

  return {
    proxyBridge,
    bridgeImplementation: bridgeOrderBook,
    testToken,
    testToken2,
    defaultAdminSigner,
    coldWalletSigner,
    communityWalletSigner,
    arbitrarySigner,
  };
}

interface BridgeOrderBookDeploymentResult {
  proxyBridge: BridgeOrderBook;
  bridgeImplementation: BridgeOrderBook;
  testToken: TestToken;
  testToken2: TestToken;
  defaultAdminSigner: SignerWithAddress;
  coldWalletSigner: SignerWithAddress;
  communityWalletSigner: SignerWithAddress;
  arbitrarySigner: SignerWithAddress;
}
