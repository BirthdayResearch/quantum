import { Erc20Token, Network } from "../../../src/types";
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

const formData = {
  sourceNetwork: Network.Ethereum,
  destinationNetwork: Network.DeFiChain,
  tokenPair: "USDT" as Erc20Token,
  amount: "0.001",
  destinationAddress: "bcrt1qamyk5n7ljrsx37d7hast5t9c7kczjhlx2etysl",
};

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
  } else {
    cy.findByTestId("txn-progress-status").should("not.exist");
  }

  cy.findByTestId("txn-status-view-etherscan").should(
    "contain.text",
    viewEtherscanText
  );
  if (showDefiscan) {
    cy.findByTestId("txn-status-view-defiscan")
      .should("be.visible")
      .should("contain.text", "DeFiScan");
  } else {
    cy.findByTestId("txn-status-view-defiscan").should("not.exist");
  }

  if (showRetryButton) {
    cy.findByTestId("txn-status-retry-btn")
      .should("be.visible")
      .should("contain.text", "Try again");
  } else {
    cy.findByTestId("txn-status-retry-btn").should("not.exist");
  }

  if (showCloseButton) {
    cy.findByTestId("txn-status-close-icon").should("be.visible").click();
    cy.findByTestId("txn-status-close-icon").should("not.exist");
  } else {
    cy.findByTestId("txn-status-close-icon").should("not.exist");
  }
}

function validateConfirmTransferModal(tokenPair: Erc20Token, amount: string) {
  cy.getTokenPairs(tokenPair).then((pair) => {
    // check review transaction modal
    cy.findByTestId("review-modal-title").should(
      "contain.text",
      "Review transaction"
    );
    cy.findByTestId("from-source-network-name").should(
      "contain.text",
      "Source (Ethereum)"
    );
    cy.findByTestId("from-source-amount").should("contain.text", `-${amount}`);
    cy.findByTestId("from-source-token-icon").should(
      "have.attr",
      "src",
      `/tokens/${pair.tokenA}.svg`
    );
    cy.findByTestId("from-source-token-name").should(
      "contain.text",
      pair.tokenA
    );

    cy.findByTestId("to-destination-network-name").should(
      "contain.text",
      "Destination (DeFiChain)"
    );
    cy.findByTestId("to-destination-amount").should("contain.text", amount);
    cy.findByTestId("to-destination-token-icon").should(
      "have.attr",
      "src",
      `/tokens/${pair.tokenB}.svg`
    );
    cy.findByTestId("to-destination-token-name").should(
      "contain.text",
      pair.tokenB
    );

    cy.findByTestId("disclaimer-msg").should(
      "contain.text",
      DISCLAIMER_MESSAGE
    );
    cy.findByTestId("fees-amount")
      .invoke("text")
      .then((text) => {
        const split = text.split(" ");
        const value = split[0];
        const suffix = split[1];
        expect(value).to.equal("0");
        expect(suffix).to.equal(pair.tokenA);
      });

    cy.findByTestId("confirm-transfer-btn").should(
      "contain.text",
      "Confirm transfer on wallet"
    );
  });
}

function initTransaction(
  confirmTransaction: boolean = true,
  confirmMetamask: boolean = true
) {
  // setup form
  cy.setupBridgeForm(
    true,
    formData.sourceNetwork,
    formData.tokenPair,
    formData.amount,
    formData.destinationAddress
  );
  cy.findByTestId("transfer-btn").click();
  cy.wait(3000);

  validateConfirmTransferModal(formData.tokenPair, formData.amount);

  if (!confirmTransaction) {
    return;
  }
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

  if (!confirmMetamask) {
    return;
  }
  // approve metamask
  cy.confirmMetamaskTransaction();
}

async function startEvmMine() {
  cy.hardhatRequest("evm_setAutomine", [true]);
  cy.hardhatRequest("evm_setIntervalMining", [500]);
}

function validateLockedForm(
  sourceNetwork: Network,
  destinationNetwork: Network,
  tokenPair: Erc20Token,
  amount: string,
  destinationAddress: string
) {
  cy.getTokenPairs(tokenPair).then((pair) => {
    // validate source data still persisted
    cy.findByTestId("source-network-dropdown-btn").should(
      "contain.text",
      sourceNetwork
    );
    cy.findByTestId("token-pair-dropdown-btn").should(
      "contain.text",
      pair.tokenA
    );
    cy.findByTestId("quick-input-card-set-amount").should(
      "have.attr",
      "value",
      amount
    );

    // validate destination data still persisted
    cy.findByTestId("destination-network-dropdown-btn").should(
      "contain.text",
      destinationNetwork
    );
    cy.findByTestId("token-to-receive-dropdown-btn").should(
      "contain.text",
      pair.tokenB
    );
    cy.findByTestId("wallet-address-input-verified-badge").should(
      "contain.text",
      destinationAddress
    );
  });

  // source fields
  cy.findByTestId("source-network-dropdown-btn").click();
  cy.findByTestId("source-network-dropdown-options").should("not.exist");
  cy.findByTestId("source-network-dropdown-icon").should("not.exist");
  cy.findByTestId("token-pair-dropdown-btn").click();
  cy.findByTestId("token-pair-dropdown-options").should("not.exist");
  cy.findByTestId("token-pair-dropdown-icon").should("not.exist");
  cy.findByTestId("quick-input-card-set-amount").should("be.disabled");
  cy.findByTestId("quick-input-card-set-amount-25%").should("be.disabled");
  cy.findByTestId("quick-input-card-set-amount-50%").should("be.disabled");
  cy.findByTestId("quick-input-card-set-amount-75%").should("be.disabled");
  cy.findByTestId("quick-input-card-set-amount-Max").should("be.disabled");
  cy.findByTestId("quick-input-card-lock-icon").should("be.visible");

  // swap button
  cy.findByTestId("transfer-flow-swap-btn").should("be.disabled");
  cy.findByTestId("swap-btn-arrow-down").should("be.visible");
  cy.findByTestId("swap-btn-switch").should("be.hidden");

  // destination fields
  cy.findByTestId("receiver-address-paste-icon-tooltip")
    .realHover()
    .then(() => {
      cy.findByTestId("receiver-address-paste-icon-tooltip-content").should(
        "not.exist"
      );
    });
  cy.findByTestId("receiver-address-input").should("be.hidden");
  cy.findByTestId("receiver-address-lock-icon").should("be.visible");

  // action buttons
  cy.findByTestId("transfer-btn").should("contain.text", "Retry transfer");
  cy.findByTestId("reset-btn")
    .should("be.visible")
    .should("contain.text", "Reset form");
}

function validateUtilityModal(
  title: string,
  message: string,
  primaryButtonLabel: string,
  secondaryButtonLabel: string
) {
  cy.findByTestId("utility-title").should("contain.text", title);
  cy.findByTestId("utility-msg").should("contain.text", message);
  cy.findByTestId("utility-primary-btn").should(
    "contain.text",
    primaryButtonLabel
  );
  cy.findByTestId("utility-secondary-btn").should(
    "contain.text",
    secondaryButtonLabel
  );
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

  it("should be able to verify locked form", () => {
    initTransaction(false);

    cy.findByTestId("review-modal-close-icon").click();

    // verify utility modal
    validateUtilityModal(
      "Are you sure you want to leave your transaction?",
      "You may lose any pending transaction and funds related to it. This is irrecoverable, proceed with caution",
      "Leave transaction",
      "Go back"
    );
    cy.findByTestId("utility-secondary-btn").click();

    cy.findByTestId("review-modal-close-icon").click();
    cy.findByTestId("utility-primary-btn").click();

    validateLockedForm(
      formData.sourceNetwork,
      formData.destinationNetwork,
      formData.tokenPair,
      formData.amount,
      formData.destinationAddress
    );
  });

  it("should be able to reset form", () => {
    initTransaction(false);
    cy.findByTestId("review-modal-close-icon").click();

    // verify utility modal
    validateUtilityModal(
      "Are you sure you want to leave your transaction?",
      "You may lose any pending transaction and funds related to it. This is irrecoverable, proceed with caution",
      "Leave transaction",
      "Go back"
    );
    cy.findByTestId("utility-primary-btn").click();

    validateLockedForm(
      formData.sourceNetwork,
      formData.destinationNetwork,
      formData.tokenPair,
      formData.amount,
      formData.destinationAddress
    );
    cy.findByTestId("reset-btn").click();
    validateUtilityModal(
      "Are you sure you want to reset form?",
      "Resetting it will lose any pending transaction and funds related to it. This is irrecoverable, proceed with caution",
      "Reset form",
      "Go back"
    );
    cy.findByTestId("utility-primary-btn").click();
    cy.validateFormPairing(true, Network.Ethereum, Network.DeFiChain, "DFI");
  });

  it("should be able to reject transaction", () => {
    initTransaction(true, false);
    // reject metamask
    cy.rejectMetamaskTransaction();

    // verify transaction error modal
    cy.findByTestId("transaction-err-title").should(
      "contain.text",
      "Transaction error"
    );
    cy.findByTestId("transaction-err-action-btn").should(
      "contain.text",
      "Try again"
    );
    cy.findByTestId("transaction-err-close-btn")
      .should("contain.text", "Close")
      .click();

    validateUtilityModal(
      "Are you sure you want to leave your transaction?",
      "You may lose any pending transaction and funds related to it. This is irrecoverable, proceed with caution",
      "Leave transaction",
      "Go back"
    );
    cy.findByTestId("utility-primary-btn").click();

    validateLockedForm(
      formData.sourceNetwork,
      formData.destinationNetwork,
      formData.tokenPair,
      formData.amount,
      formData.destinationAddress
    );
  });

  it("should be able to verify transaction status - failed", () => {
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

  it("should be able to verify transaction status - reverted", () => {
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

  it("should be able to bridge USDT", () => {
    initTransaction();
    validateTransactionStatus(TransactionStatusType.INITIAL);
    // verify form is not able to proceed another transaction
    cy.findByTestId("transfer-btn")
      .should("be.disabled")
      .should("contain.text", "Pending Transaction");
    cy.findByTestId("transfer-btn-loader-icon").should("be.visible");
    cy.findByTestId("error-transaction-pending")
      .should("be.visible")
      .should("have.text", "Unable to edit while transaction is pending");

    startEvmMine();
    waitUntilEvmBlocksConfirm();
    // verify is DFC confirmation now
    cy.findByTestId("txn-progress-status").should("contain.text", "For DFC");
    // continue verify blocks
    waitUntilBlocksConfirm();
    validateTransactionStatus(TransactionStatusType.CONFIRM);

    // verify transfer button is enabled
    cy.findByTestId("transfer-btn")
      .should("be.enabled")
      .should("contain.text", "Review transaction");
  });
});