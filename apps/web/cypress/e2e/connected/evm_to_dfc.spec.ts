import { Network } from "../../../src/types";
import BigNumber from "bignumber.js";
import {
  CONFIRMATIONS_BLOCK_TOTAL,
  DISCLAIMER_MESSAGE,
  EVM_CONFIRMATIONS_BLOCK_TOTAL,
} from "../../../src/constants";
import { HttpStatusCode } from "axios";

enum TransactionStatusType {
  INITIAL,
  CONFIRM,
  FAILED,
  REVERTED,
}

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

function validateTransactionStatus(status: TransactionStatusType) {
  cy.findByTestId("txn-status-container").should("be.visible");

  let borderColor = undefined;
  let title;
  let description;
  let progressStatusText = undefined;
  let showRetryButton = false;
  let showCloseButton = false;
  let viewEtherscanText = "View on Etherscan";
  let showDefiscan = false;

  if (status === TransactionStatusType.FAILED) {
    borderColor = "rgb(229, 69, 69)";
    title = "Transaction failed";
    description =
      "We encountered an error while processing your transaction. Please try again after a few minutes.";
    showRetryButton = true;
  } else if (status === TransactionStatusType.REVERTED) {
    borderColor = "rgb(217, 123, 1)";
    title = "Transaction reverted";
    description =
      "Something went wrong as the transaction was being processed. Please wait for the required confirmations to proceed with your transaction.";
    progressStatusText = "For EVM";
    showCloseButton = true;
  } else if (status === TransactionStatusType.CONFIRM) {
    borderColor = "rgba(51, 51, 51, 0.5)";
    title = "Transaction confirmed";
    description = "Expect to receive your tokens in your wallet shortly.";
    progressStatusText = "Confirmed";
    showCloseButton = true;
    viewEtherscanText = "Etherscan";
    showDefiscan = true;
  } else {
    // INITIAL
    title = "Awaiting confirmation";
    description =
      "Your transaction is being processed. We recommend keeping your tab open to ensure you receive your funds. Please only close the tab after your DFI transaction ID is displayed.";
    progressStatusText = "For EVM";
  }

  if (borderColor !== undefined) {
    cy.findByTestId("txn-status-container").should(
      "have.css",
      "border-color",
      borderColor
    );
  }

  cy.findByTestId("txn-status-title").should("contain.text", title);
  cy.findByTestId("txn-status-desc").should("contain.text", description);
  if (progressStatusText !== undefined) {
    cy.findByTestId("txn-progress-status").should(
      "contain.text",
      progressStatusText
    );
  }

  cy.findByTestId("txn-status-view-etherscan").should(
    "contain.text",
    viewEtherscanText
  );
  if (showDefiscan) {
    cy.findByTestId("txn-status-view-defiscan")
      .should("be.visible")
      .should("contain.text", "DeFiScan");
  }

  if (showRetryButton) {
    cy.findByTestId("txn-status-retry-btn")
      .should("contain.text", "Try again")
      .should("be.visible");
  }

  if (showCloseButton) {
    cy.findByTestId("txn-status-close-icon").should("be.visible");
  }
}

function initTransaction(confirmTransaction: boolean = true) {
  // setup form
  cy.setupBridgeForm(
    true,
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
  cy.findByTestId("to-destination-token-name").should("contain.text", "dUSDT");

  cy.findByTestId("disclaimer-msg").should("contain.text", DISCLAIMER_MESSAGE);
  cy.findByTestId("fees-amount")
    .invoke("text")
    .then((text) => {
      const split = text.split(" ");
      const value = split[0];
      const suffix = split[1];
      expect(value).to.equal("0");
      expect(suffix).to.equal("USDT");
    });

  cy.findByTestId("confirm-transfer-btn")
    .should("contain.text", "Confirm transfer on wallet")
    .click();

  // check confirmation modal
  cy.findByTestId("bridge-status-title").should(
    "contain.text",
    "Waiting for confirmation"
  );
  cy.findByTestId("bridge-status-msg").should(
    "contain.text",
    "Confirm this transaction in your Wallet."
  );

  if (confirmTransaction) {
    // approve metamask
    cy.confirmMetamaskTransaction();
  }
}

async function startEvmMine() {
  cy.hardhatRequest("evm_setAutomine", [true]);
  cy.hardhatRequest("evm_setIntervalMining", [500]);
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

  // it("should be able to lock form", () => {
  //   // setup form
  //   cy.setupBridgeForm(
  //     Network.Ethereum,
  //     "USDT",
  //     "0.001",
  //     "bcrt1qr3d3d0pdcw5as77crdy6pchh7j7xy4pfyhg64d"
  //   );
  //   cy.findByTestId("transfer-btn").click();
  //   cy.wait(3000);
  //
  //   cy.findByTestId("review-modal-close-icon").click();
  //
  //   // verify form locked
  //   cy.findByTestId("transfer-btn").should("contain.text", "Retry transfer");
  //   cy.findByTestId("reset-btn").should("be.visible");
  // });

  it("should be able verify transaction status - failed", () => {
    initTransaction();
    cy.intercept("POST", "**/ethereum/handleTransaction", {
      statusCode: HttpStatusCode.BadRequest,
      body: {
        statusCode: HttpStatusCode.BadRequest,
        error: "There is a problem in allocating fund",
      },
    });

    validateTransactionStatus(TransactionStatusType.FAILED);
  });

  it("should be able verify transaction status - reverted", () => {
    initTransaction();
    cy.intercept("POST", "**/ethereum/handleTransaction", {
      statusCode: HttpStatusCode.BadRequest,
      body: {
        statusCode: HttpStatusCode.BadRequest,
        message: "Transaction Reverted",
      },
    });

    validateTransactionStatus(TransactionStatusType.REVERTED);
  });

  it.only("should be able to bridge USDT", () => {
    initTransaction();
    validateTransactionStatus(TransactionStatusType.INITIAL);
    // verify form is not able to proceed another transaction
    cy.findByTestId("transfer-btn")
      .should("be.disabled")
      .should("contain.text", "Pending Transaction");
    cy.findByTestId("transfer-btn-loader-icon").should("be.visible");

    startEvmMine();
    waitUntilEvmBlocksConfirm();
    cy.findByTestId("txn-progress-status").should("contain.text", "For DFC");
    waitUntilBlocksConfirm();
    validateTransactionStatus(TransactionStatusType.CONFIRM);

    // verify transfer button is enabled
    cy.findByTestId("transfer-btn")
      .should("be.enabled")
      .should("contain.text", "Review transaction");
  });
});
