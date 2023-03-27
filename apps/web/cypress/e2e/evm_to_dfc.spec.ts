import { Network } from "../../src/types";
import BigNumber from "bignumber.js";
import {
  CONFIRMATIONS_BLOCK_TOTAL,
  EVM_CONFIRMATIONS_BLOCK_TOTAL,
} from "../../src/constants";

function waitUntilEvmBlocksConfirm(): void {
  cy.findByTestId("txn-progress-blocks")
    .invoke("text")
    .then((text: string) => {
      const value = text.split(" ")[0];
      const currentBlockCount = new BigNumber(value);
      if (currentBlockCount.lt(new BigNumber(EVM_CONFIRMATIONS_BLOCK_TOTAL))) {
        cy.wait(15000);
        waitUntilEvmBlocksConfirm();
      }
    });
}

function waitUntilBlocksConfirm(): void {
  cy.findByTestId("txn-progress-blocks")
    .invoke("text")
    .then((text: string) => {
      const value = text.split(" ")[0];
      const currentBlockCount = new BigNumber(value);
      if (currentBlockCount.lt(new BigNumber(CONFIRMATIONS_BLOCK_TOTAL))) {
        cy.wait(15000);
        waitUntilBlocksConfirm();
      }
    });
}

beforeEach(() => {
  cy.visit("http://localhost:3000/?network=Local", {
    onBeforeLoad: (win) => {
      let nextData: any;
      Object.defineProperty(win, "__NEXT_DATA__", {
        set(o) {
          console.log("setting __NEXT_DATA__", o.props.pageProps);
          // here is our change to modify the injected parsed data
          o.props.pageProps.isBridgeUp = true;
          nextData = o;
        },
        get() {
          return nextData;
        },
      });
    },
  });
});

describe("QA-769-10 Connected wallet - ETH > DFC - USDT", () => {
  let connectedWalletAddress: string;

  beforeEach(() => {
    cy.connectMetaMaskWallet();
    cy.getMetamaskWalletAddress().then((address) => {
      if (address !== undefined) {
        connectedWalletAddress = address as string;
      }
    });
  });

  it("should be able to lock form", () => {
    // setup form
    cy.setupBridgeForm(
      Network.Ethereum,
      "USDT",
      "0.001",
      "bcrt1qr3d3d0pdcw5as77crdy6pchh7j7xy4pfyhg64d"
    );
    cy.findByTestId("transfer-btn").click();
    cy.wait(3000);

    cy.findByTestId("review-modal-close-icon").click();

    // verify form locked
    cy.findByTestId("transfer-btn").should("contain.text", "Retry transfer");
    cy.findByTestId("reset-btn").should("be.visible");
  });

  it("should be able to bridge USDT", () => {
    // setup form
    cy.setupBridgeForm(
      Network.Ethereum,
      "USDT",
      "0.001",
      "bcrt1qr3d3d0pdcw5as77crdy6pchh7j7xy4pfyhg64d"
    );
    cy.findByTestId("transfer-btn").click();
    cy.wait(3000);

    // check review transaction modal
    cy.findByTestId("review-modal-title").should(
      "contain.text",
      "Review transaction"
    );
    cy.findByTestId("from-source-network-name").should(
      "contain.text",
      "Source (Ethereum)"
    );
    cy.findByTestId("from-source-amount").should("contain.text", "-0.001");
    cy.findByTestId("from-source-token-icon").should(
      "have.attr",
      "src",
      "/tokens/USDT.svg"
    );
    cy.findByTestId("from-source-token-name").should("contain.text", "USDT");

    cy.findByTestId("to-destination-network-name").should(
      "contain.text",
      "Destination (DeFiChain)"
    );
    cy.findByTestId("to-destination-amount").should("contain.text", "0.001");
    cy.findByTestId("to-destination-token-icon").should(
      "have.attr",
      "src",
      "/tokens/dUSDT.svg"
    );
    cy.findByTestId("to-destination-token-name").should(
      "contain.text",
      "dUSDT"
    );

    cy.findByTestId("fees-amount")
      .invoke("text")
      .then((text) => {
        const value = text.split(" ")[0];
        expect(value).to.equal("0");
      });

    cy.findByTestId("confirm-transfer-btn").click();

    // check confirmation modal
    cy.findByTestId("bridge-status-title").should(
      "contain.text",
      "Waiting for confirmation"
    );
    cy.findByTestId("bridge-status-msg").should(
      "contain.text",
      "Confirm this transaction in your Wallet."
    );

    // approve metamask
    cy.confirmMetamaskTransaction();

    // check transaction status
    cy.findByTestId("txn-status-container").should("be.visible");
    cy.findByTestId("txn-status-title").should(
      "contain.text",
      "Awaiting confirmation"
    );
    cy.findByTestId("txn-status-desc").should(
      "contain.text",
      "Your transaction is being processed. We recommend keeping your tab open to ensure you receive your funds. Please only close the tab after your DFI transaction ID is displayed."
    );

    // waitUntilEvmBlocksConfirm();
    // cy.findByTestId("txn-status-evm-confirm-block-icon").should(
    //   "have.attr",
    //   "className",
    //   "#0CC72C"
    // );

    waitUntilBlocksConfirm();
    // cy.findByTestId("txn-status-dfc-confirm-block-icon").should(
    //   "have.attr",
    //   "fill",
    //   "#0CC72C"
    // );
    cy.findByTestId("txn-status-title").should(
      "contain.text",
      "Transaction confirmed"
    );
    cy.findByTestId("txn-status-desc").should(
      "contain.text",
      "Expect to receive your tokens in your wallet shortly."
    );
  });
});
