/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from 'hardhat';

import { TestToken__factory } from '../generated';

require('dotenv').config({
  path: './.env',
});

async function main() {
  const usdcAddress = '0xB200af2b733B831Fbb3d98b13076BC33F605aD58';
  const usdtAddress = '0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF';
  const provider = new ethers.providers.JsonRpcProvider(process.env.GOERLI_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  // const signer = provider.ge//(wallet.address);
  const mUsdcContract = new ethers.Contract(usdtAddress, TestToken__factory.createInterface(), wallet);
  const mintFunction = await mUsdcContract.functions.mint(wallet.address, 100);

  // Get the estimated gas cost of the mint function
  const gasEstimate = await mUsdcContract.estimateGas.mint(wallet.address, 100);

  // Build the transaction object
  const tx = {
    to: usdcAddress,
    data: mintFunction,
    gasLimit: 40000000000,
    gasPrice: 40000000000,
  };

  // Sign and send the transaction
  const signedTx = await wallet.signTransaction(tx);
  const receipt = await provider.sendTransaction(signedTx);
  await receipt.wait();
  //   // const decimal = 10 ** (await mUsdcContract.decimals());
  //   const amont = ethers.utils.parseEther('1000');
  //   const tx = {
  //     value: { address: wallet.address, amount: 10000 },
  //     data: `mint(address, amount)`,
  //     to: '0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF',
  //     from: '0x5aB853A40b3b9A16891e8bc8e58730AE3Ec102b2',
  //     gasLimit: 30000000000,
  //   };
  //   const tr = await wallet.sendTransaction(tx);
  //   await tr.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
