import { Erc20Token, Network } from "../../../src/types";
import BigNumber from "bignumber.js";
import {
  CONFIRMATIONS_BLOCK_TOTAL,
  EVM_CONFIRMATIONS_BLOCK_TOTAL,
} from "../../../src/constants";
import { HttpStatusCode } from "axios";
import { UtilityButtonType } from "../../support/utils";
import { LOCAL_HARDHAT_CONFIG } from "../../../src/config";

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

function verifyTransactionStatus(status: TransactionStatusType) {
  cy.findByTestId("txn-status-container").should("be.visible");

  let borderColor;
  let title;
  let description;
  let progressStatusText = undefined;
  let showRetryButton = false;
  let showCloseButton = false;
  let viewEtherscanText = "View on Etherscan";
  let showDefiscan = false;

  if (status === TransactionStatusType.FAILED) {
    borderColor = "border-error";
    title = "Transaction failed";
    description =
      "We encountered an error while processing your transaction. Please try again after a few minutes.";
    showRetryButton = true;
  } else if (status === TransactionStatusType.REVERTED) {
    borderColor = "border-warning";
    title = "Transaction reverted";
    description =
      "Something went wrong as the transaction was being processed. Please wait for the required confirmations to proceed with your transaction.";
    progressStatusText = "For EVM";
    showCloseButton = true;
  } else if (status === TransactionStatusType.CONFIRM) {
    borderColor = "border-dark-card-stroke";
    title = "Transaction confirmed";
    description = "Expect to receive your tokens in your wallet shortly.";
    progressStatusText = "Confirmed";
    showCloseButton = true;
    viewEtherscanText = "Etherscan";
    showDefiscan = true;
  } else {
    // INITIAL
    borderColor = "border-transparent";
    title = "Awaiting confirmation";
    description =
      "Your transaction is being processed. We recommend keeping your tab open to ensure you receive your funds. Please only close the tab after your DFI transaction ID is displayed.";
    progressStatusText = "For EVM";
  }

  cy.findByTestId("txn-status-container").should("have.class", borderColor);
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

function initTransaction(
  connectedWalletAddress: string,
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
  // wait for contract
  cy.wait(3000);

  cy.verifyConfirmTransferModal(
    formData.sourceNetwork,
    formData.tokenPair,
    formData.amount,
    formData.amount,
    "0",
    connectedWalletAddress,
    formData.destinationAddress
  );

  if (!confirmTransaction) {
    return;
  }
  cy.findByTestId("confirm-transfer-btn").click();

  // check confirmation modal
  cy.verifyConfirmationModal();

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

function verifyRestoreModalInitialState() {
  // verify restore modal
  cy.findByTestId("restore-txn-modal").should("be.visible");
  cy.findByTestId("restore-txn-title").should(
    "contain.text",
    "Recover transaction"
  );
  cy.findByTestId("restore-txn-msg").should(
    "contain.text",
    "Enter your Ethereum transaction ID to load your transaction again for review"
  );
  cy.findByTestId("restore-txn-input-label").should(
    "contain.text",
    "Transaction ID"
  );
  cy.findByTestId("restore-txn-tooltip").realHover();
  cy.findByTestId("restore-txn-input-container").should(
    "have.class",
    "border-dark-300"
  );
  cy.findByTestId("restore-txn-tooltip-content")
    .should("be.visible")
    .should("contain.text", "Paste from clipboard");
  cy.findByTestId("restore-txn-input")
    .invoke("attr", "placeholder")
    .then((placeholder) => {
      expect(placeholder).to.equal("Enter Transaction ID");
    });
  cy.findByTestId("restore-txn-input-error-msg").should("not.exist");
  cy.findByTestId("restore-txn-btn")
    .should("be.disabled")
    .should("contain.text", "Restore transaction");
}

beforeEach(() => {
  cy.visitBridgeHomePage();
  cy.connectMetaMaskWallet();
});

context("QA-769-5 Connected wallet - Restore Lost Session", () => {
  before(() => {
    // mint dfc HW balance
    cy.sendTokenToWallet(LOCAL_HARDHAT_CONFIG.HotWalletAddress, "10", [
      "USDT",
      "UTXO",
    ]);
  });

  it("1: Verify restore button visibility", () => {
    // shown default
    cy.findByTestId("transaction-interrupted-msg")
      .should("be.visible")
      .should("contain.text", "Transaction interrupted?");

    // hidden when amount is input
    cy.findByTestId("quick-input-card-set-amount").type("0.001");
    cy.findByTestId("transaction-interrupted-msg").should("not.exist");
    cy.findByTestId("quick-input-card-clear-icon").click();
    cy.findByTestId("transaction-interrupted-msg").should("be.visible");

    // hidden when is DFC > EVM
    cy.findByTestId("transfer-flow-swap-btn").click();
    cy.findByTestId("transaction-interrupted-msg").should("not.exist");
    cy.findByTestId("transfer-flow-swap-btn").click();
    cy.findByTestId("transaction-interrupted-msg").should("be.visible");
  });

  it("2: Verify restore modal", () => {
    cy.findByTestId("restore-btn").click();
    verifyRestoreModalInitialState();

    // verify input error
    cy.findByTestId("restore-txn-input").type("qwerty123$%");
    cy.findByTestId("restore-txn-btn").should("be.enabled").click();
    cy.findByTestId("restore-txn-input-error-msg")
      .should("be.visible")
      .should(
        "contain.text",
        "Enter a valid Ethereum txid performed on Quantum"
      );
    cy.findByTestId("restore-txn-input-container").should(
      "have.class",
      "border-error"
    );

    // verify input cleared
    cy.findByTestId("restore-txn-clear-icon").click();
    cy.findByTestId("restore-txn-input").should("contain.text", "");
    cy.findByTestId("restore-txn-input-error-msg").should("not.exist");
    cy.findByTestId("restore-txn-input-container").should(
      "have.class",
      "border-transparent"
    );
    cy.findByTestId("restore-txn-btn").should("be.disabled");

    // close modal
    cy.findByTestId("restore-txn-modal-close-icon").click();
    cy.findByTestId("restore-txn-modal").should("not.exist");
    cy.findByTestId("bridge-form").should("be.visible");
  });
});

context("QA-799-6 Restore Lost Session", () => {
  it("1: Should be able to restore lost session", () => {
    cy.getMetamaskWalletAddress().then((address) => {
      if (address !== undefined) {
        initTransaction(address);
      }
    });

    // get unconfirmed txn stored and clear local storage
    cy.wait(2000);
    const TXN_HASH_STORAGE_KEY = "bridge.Local.unconfirmed-txn-hash";
    cy.getLocalStorage(TXN_HASH_STORAGE_KEY).then((value) => {
      // native way has an issue, that's why library is used to retrieved
      const unconfirmedTxnHashKeyStorage = value;
      if (unconfirmedTxnHashKeyStorage === null) {
        // purposely fail test if no local unconfirmed txn hash in storage
        cy.contains("Unable to find local unconfirmed txn hash in storage");
        return;
      }

      // remove unconfirmed txn has from local storage and refresh page
      cy.removeLocalStorage(TXN_HASH_STORAGE_KEY);
      cy.reload();
      // no more transaction status on going
      cy.findByTestId("txn-status-container").should("not.exist");

      // open restore modal and use key in unconfirmed txn
      cy.findByTestId("restore-btn").click();
      verifyRestoreModalInitialState();
      cy.findByTestId("restore-txn-input").type(
        JSON.parse(unconfirmedTxnHashKeyStorage)
      ); // parsing this, so it wouldn't have extra "" surrounding it
      cy.findByTestId("restore-txn-btn").click();

      // verify transaction status is displayed again
      verifyTransactionStatus(TransactionStatusType.INITIAL);
    });
  });
});

context("QA-769-10 Connected wallet - ETH > DFC - USDT", () => {
  let connectedWalletAddress: string;

  beforeEach(() => {
    cy.getMetamaskWalletAddress().then((address) => {
      if (address !== undefined) {
        connectedWalletAddress = address as string;
      }
    });
  });

  it("1: should be able to verify locked form and reset form", () => {
    // setup form
    cy.setupBridgeForm(
      true,
      formData.sourceNetwork,
      formData.tokenPair,
      formData.amount,
      formData.destinationAddress
    );
    // verify locked and test reset form
    cy.verifyLockedAndResetForm(
      formData.sourceNetwork,
      formData.destinationNetwork,
      formData.tokenPair,
      formData.amount,
      formData.destinationAddress
    );
  });

  it("2: should be able to reject transaction and retry", () => {
    initTransaction(connectedWalletAddress, true, false);
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
    // close using btn
    cy.findByTestId("transaction-err-close-btn")
      .should("contain.text", "Close")
      .click();

    cy.verifyUtilityModal({
      title: "Are you sure you want to leave your transaction?",
      message:
        "You may lose any pending transaction and funds related to it. This is irrecoverable, proceed with caution",
      primaryButtonLabel: "Leave transaction",
      secondaryButtonLabel: "Go back",
      clickButton: UtilityButtonType.PRIMARY,
    });

    cy.verifyLockedForm(
      formData.sourceNetwork,
      formData.destinationNetwork,
      formData.tokenPair,
      formData.amount,
      formData.destinationAddress
    );

    // retry transaction
    cy.findByTestId("transfer-btn").click();
    // wait for contract
    cy.wait(3000);
    cy.verifyConfirmTransferModal(
      formData.sourceNetwork,
      formData.tokenPair,
      formData.amount,
      formData.amount,
      "0",
      connectedWalletAddress,
      formData.destinationAddress
    );
    cy.findByTestId("confirm-transfer-btn").click();

    // check confirmation modal
    cy.verifyConfirmationModal();

    // still able to accept metamask transaction
    cy.confirmMetamaskTransaction();
  });

  it("3: should be able to verify transaction status - failed", () => {
    initTransaction(connectedWalletAddress);
    cy.intercept("POST", "**/ethereum/handleTransaction", {
      statusCode: HttpStatusCode.BadRequest,
      body: {
        statusCode: HttpStatusCode.BadRequest,
        error: "There is a problem in allocating fund",
      },
    });

    verifyTransactionStatus(TransactionStatusType.FAILED);
  });

  it("4: should be able to verify transaction status - reverted", () => {
    initTransaction(connectedWalletAddress);
    cy.intercept("POST", "**/ethereum/handleTransaction", {
      statusCode: HttpStatusCode.BadRequest,
      body: {
        statusCode: HttpStatusCode.BadRequest,
        message: "Transaction Reverted",
      },
    });

    verifyTransactionStatus(TransactionStatusType.REVERTED);
  });

  it("5: should be able to bridge USDT", () => {
    // check initial balance
    cy.getDfcWalletBalance(formData.destinationAddress).then((balances) => {
      const initialBalance = balances.find(
        (item) => item.symbol === formData.tokenPair
      );
      const initialBalanceAmount =
        initialBalance !== undefined ? initialBalance.amount : 0;

      initTransaction(connectedWalletAddress);
      verifyTransactionStatus(TransactionStatusType.INITIAL);
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
      verifyTransactionStatus(TransactionStatusType.CONFIRM);

      // verify transfer button is enabled
      cy.findByTestId("transfer-btn")
        .should("be.enabled")
        .should("contain.text", "Review transaction");

      // check final balance, should be updated
      cy.getDfcWalletBalance(formData.destinationAddress).then((balances) => {
        const finalBalance = balances.find(
          (item) => item.symbol === formData.tokenPair
        );
        const finalBalanceAmount =
          finalBalance !== undefined ? finalBalance.amount : 0;
        const diff = new BigNumber(finalBalanceAmount).minus(
          new BigNumber(initialBalanceAmount)
        );
        expect(diff.toFixed()).to.equal(formData.amount);
      });
    });
  });
});
