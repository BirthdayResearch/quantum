import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { deployContracts } from "./utils/deployment";
import { toWei } from "./utils/mathUtils";
import { BridgeOrderBook__factory } from "../generated";
// import { amountAfterFee, toWei } from "./testUtils/mathUtils";

describe("Bridge order tests", () => {
  // describe("Administrative functions", () => {
  //   describe("Add supported tokens", () => {
  //     it("Should add supported tokens successfully", async () => {
  //       const { proxyBridge, testToken, defaultAdminSigner } =
  //         await loadFixture(deployContracts);
  //       expect(await proxyBridge.supportedTokens(testToken.address)).to.equal(
  //         false
  //       );
  //       await proxyBridge
  //         .connect(defaultAdminSigner)
  //         .addSupportedToken(testToken.address);
  //       expect(await proxyBridge.supportedTokens(testToken.address)).to.equal(
  //         true
  //       );
  //     });

  //     it("Failed to add because of unauthorization", async () => {
  //       const { proxyBridge, testToken, arbitrarySigner } = await loadFixture(
  //         deployContracts
  //       );
  //       expect(await proxyBridge.supportedTokens(testToken.address)).to.equal(
  //         false
  //       );
  //       expect(
  //         await proxyBridge
  //           .connect(arbitrarySigner)
  //           .addSupportedToken(testToken.address)
  //       ).to.reverted;
  //     });
  //   });

  //   describe("Remove supported token", () => {

  //   })
  // });
  describe("Handling bridging request", () => {
    it("Test bridgeToDeFiChain function", async () => {
      const { proxyBridge, testToken, defaultAdminSigner, coldWalletSigner } =
        await loadFixture(deployContracts);
      await testToken.mint(defaultAdminSigner.address, toWei("100"));
      await proxyBridge.addSupportedToken(testToken.address);
      await testToken.approve(proxyBridge.address, ethers.constants.MaxUint256);
      expect(await testToken.balanceOf(coldWalletSigner.address)).to.equal(0);
      const tx = await proxyBridge.bridgeToDeFiChain(
        ethers.constants.AddressZero,
        testToken.address,
        toWei("1")
      );
      expect(await testToken.balanceOf(coldWalletSigner.address)).to.equal(
        toWei("1")
      );
      console.log(tx.data);
      console.log(
        BridgeOrderBook__factory.createInterface().parseTransaction({
          data: tx.data,
        })
      );
    });

    // to demonstrate that our current method does not account for all of the situations
    it("Case where parseTransaction fails", async () => {
      const { proxyBridge, testToken, defaultAdminSigner, coldWalletSigner } =
        await loadFixture(deployContracts);
      await testToken.mint(defaultAdminSigner.address, toWei("100"));
      await proxyBridge.addSupportedToken(testToken.address);
      await testToken.approve(proxyBridge.address, ethers.constants.MaxUint256);
      expect(await testToken.balanceOf(coldWalletSigner.address)).to.equal(0);
      const normalInputData =
        BridgeOrderBook__factory.createInterface().encodeFunctionData(
          "bridgeToDeFiChain",
          [ethers.constants.AddressZero, testToken.address, toWei("1")]
        );
      const abnormalInputData = normalInputData.substring(
        0,
        normalInputData.length - 2
      );
      const tx = await defaultAdminSigner.sendTransaction({
        to: proxyBridge.address,
        data: abnormalInputData,
      });
      expect(await testToken.balanceOf(coldWalletSigner.address)).to.equal(
        toWei("1")
      );
      expect(tx).to.emit(proxyBridge, "BRIDGE_TO_DEFI_CHAIN");
      console.log(tx.data);
      expect(() => {
        BridgeOrderBook__factory.createInterface().parseTransaction({
          data: tx.data,
        });
      }).to.throw(
        "data out-of-bounds (length=63, offset=64, code=BUFFER_OVERRUN, version=abi/5.7.0)"
      );
    });
  });
});
