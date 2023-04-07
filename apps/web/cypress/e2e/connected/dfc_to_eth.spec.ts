/* eslint-disable cypress/no-unnecessary-waiting */
import { DfcToErcTransferSteps } from "../../../src/constants";
import { Erc20Token, Network } from "../../../src/types";
import { HttpStatusCode } from "axios";
import dayjs from "dayjs";
import { UtilityButtonType } from "../../support/utils";
import { LOCAL_HARDHAT_CONFIG } from "../../../src/config";

const formData = {
  sourceNetwork: Network.DeFiChain,
  destinationNetwork: Network.Ethereum,
  tokenPair: "EUROC" as Erc20Token,
  amount: "0.4",
  refundAddress: "bcrt1qamyk5n7ljrsx37d7hast5t9c7kczjhlx2etysl",
};

let connectedWalletAddress: string;
const fee = "0.0012";
const toReceive = "0.3988";

enum TitleLabel {
  Validating = "Validating your transaction",
  Validated = "Transaction has been validated",
  Rejected = "Validation failed",
  ThrottleLimit = "Verification attempt limit reached",
}

enum ContentLabel {
  Validating = "Please wait as we verify the funds transfer to the provided address. Upon validation, you will be redirected to the next stage to claim your tokens",
  Validated = "Please wait as we redirect you to the next step.",
  ThrottleLimit = "Please wait for a minute and try again.",
}

function verifyStep(stepNumber: number) {
  DfcToErcTransferSteps.forEach(({ step, label }, idx) => {
    cy.findByTestId(`erc-transfer-step-${idx}`).within(() => {
      const isCurrentlyStep4 = stepNumber === 4 && step === stepNumber;

      // Verify step node
      cy.findByTestId("step-node")
        .should(
          "have.class",
          isCurrentlyStep4 || stepNumber > step ? "bg-valid" : "bg-dark-100"
        )
        .should(
          "have.class",
          stepNumber >= step ? "border-valid" : "border-dark-500"
        );

      if (stepNumber === step) {
        cy.findByTestId("step-number").should("contain.text", stepNumber);
      }

      // Verify step label
      cy.findByTestId("step-label")
        .should(
          "have.class",
          isCurrentlyStep4 || stepNumber !== step
            ? "text-dark-500"
            : "text-dark-1000"
        )
        .should("contain.text", label);
    });
  });
}

function sendTokenToWallet() {
  cy.findByTestId("temp-defichain-sending-text")
    .invoke("text")
    .then((text) => {
      cy.sendTokenToWallet(text, formData.amount, [formData.tokenPair]);
    });
}

function verifyStepOneForm() {
  cy.wait(1000);
  cy.findByTestId("erc-transfer-step-one").should("be.visible");

  // real hover is not reliable here, not sure why
  // cy.findByTestId("transaction-error-info-tooltip-icon").realHover();
  // cy.findByTestId("transaction-error-info-tooltip-content")
  //   .should("be.visible")
  //   .should("contain.text", TRANSACTION_ERROR_INFO.content);

  // check DeFichain address input
  cy.findByTestId("defichain-address-input")
    .should("be.visible")
    .invoke("attr", "placeholder")
    .then((actualPlaceholder) => {
      expect(actualPlaceholder).to.equal("Enter DeFiChain address");
    });

  cy.findByTestId("defichain-address-input").type("abcde");
  cy.findByTestId("defichain-address").should("have.class", "border-error");

  cy.findByTestId("defichain-address-error-msg")
    .should("exist")
    .should("contain.text", "Use correct address for DeFiChain Local"); // TODO: to make it dynamic based on env
  cy.findByTestId("go-to-next-step-btn").should("be.disabled");
  cy.findByTestId("defichain-address-clear").click(); // verify clear button functionality
  cy.findByTestId("defichain-address-input").type(formData.refundAddress);
  cy.findByTestId("wallet-address-input-verified-badge").should("exist"); // verify badge functionality
}

function verifyStepTwoForm(pair: { tokenA: string; tokenB: string }) {
  cy.wait(1000); // to wait for QR code to load
  cy.findByTestId("temp-defichain-sending-qr-address").should("be.visible");
  cy.findByTestId("temp-defichain-sending-address").should("be.visible");

  cy.findByTestId("transact-token-amount")
    .should("be.visible")
    .should("contain.text", formData.amount);

  cy.findByTestId("transact-token-logo")
    .should("be.visible")
    .should("have.attr", "alt", pair.tokenB)
    .should("have.attr", "src", `/tokens/${pair.tokenB}.svg`);

  cy.findByTestId("transact-token-name")
    .should("be.visible")
    .should("contain.text", pair.tokenB);

  if (pair.tokenB === "DFI") {
    cy.findByTestId("dfi-warning")
      .should("be.visible")
      .should("contain.text", "Please only send DFI (UTXO) tokens.");
  } else {
    cy.findByTestId("dfi-warning").should("not.exist");
  }

  cy.findByTestId("irreversible-alert-container").should("be.visible");
}

function proceedUntilStep(stepNumber: number) {
  // bridge form setup
  cy.setupBridgeForm(
    true,
    formData.sourceNetwork,
    formData.tokenPair,
    formData.amount
  );

  // verify review button state
  cy.findByTestId("transfer-btn").click();

  cy.verifyConfirmTransferModal(
    formData.sourceNetwork,
    formData.tokenPair,
    formData.amount,
    toReceive,
    fee,
    connectedWalletAddress
  );

  // verify erc-transfer-step-one
  cy.findByTestId("erc-transfer-procedure").should("be.visible");
  cy.findByTestId("erc-transfer-progress").should("be.visible");

  // verify step 1
  // validating progress step
  verifyStep(1);
  verifyStepOneForm();
  if (stepNumber <= 1) {
    return;
  }

  cy.getTokenPairs(formData.tokenPair).then((pair) => {
    cy.findByTestId("go-to-next-step-btn").click();

    // verify Step 2
    // validating progress step
    cy.findByTestId("erc-transfer-step-two").should("be.visible");
    verifyStep(2);
    verifyStepTwoForm(pair);

    if (stepNumber <= 2) {
      return;
    }

    // sending token to wallet
    sendTokenToWallet();
    // wait for transaction to be verified
    cy.wait(5000);
    cy.findByTestId("verify-hot-wallet-transfer").should("be.visible").click();

    // no controls over step 3 proceeding to step 4 here, step 3 is passing too fast, so no verification for step 3
    cy.wait(2000);

    // last step
    verifyStep(4);
    cy.findByTestId("claim-title")
      .should("be.visible")
      .should("contain.text", "Ready for claiming");

    cy.findByTestId("claim-content")
      .should("be.visible")
      .should(
        "contain.text",
        "Your transaction has been verified and is now ready to be transferred to destination chain (ERC-20). You will be redirected to your wallet to claim your tokens."
      );

    cy.findByTestId("claim-action-btn")
      .should("be.visible")
      .should("contain.text", "Claim tokens");
    cy.findByTestId("ready-for-claiming-timing").should("be.visible");
  });
}

beforeEach(() => {
  cy.visitBridgeHomePage();
  cy.connectMetaMaskWallet();
  cy.getMetamaskWalletAddress().then((address) => {
    if (address !== undefined) {
      connectedWalletAddress = address as string;
    }
  });
});

context("QA-770-5~10 Connected wallet - DFC > ETH - EUROC", () => {
  before(() => {
    cy.sendTokenToWallet(formData.refundAddress, "10", ["EUROC", "UTXO"]);
    cy.sendTokenToWallet(LOCAL_HARDHAT_CONFIG.HotWalletAddress, "10", [
      "EUROC",
      "UTXO",
    ]);
  });

  it("1. Verify reset form functionality : DFC -> ETH", () => {
    // bridge form setup
    cy.setupBridgeForm(
      true,
      formData.sourceNetwork,
      formData.tokenPair,
      formData.amount
    );

    // verify locked and test reset form
    cy.verifyLockedAndResetForm(
      formData.sourceNetwork,
      formData.destinationNetwork,
      formData.tokenPair,
      formData.amount,
      // formData.destinationAddress
      connectedWalletAddress
    );
  });

  it("2. Verify form setup DFC -> ETH - Transfer not verified (not sending any token)", () => {
    proceedUntilStep(2);

    cy.findByTestId("verify-hot-wallet-transfer")
      .should("be.visible")
      .should("be.enabled")
      .click();

    // verify Step 3
    verifyStep(3);
    cy.findByTestId("erc-transfer-step-three").should("be.visible");

    // verify  will fail
    cy.findByTestId("revalidate-transaction")
      .should("be.visible")
      .should("contain.text", "Try again")
      .click();
    cy.wait(3000);

    cy.findByTestId("verification-title")
      .should("exist")
      .should("contain.text", "Something went wrong (Error code 4)");

    cy.findByTestId("verification-content")
      .should("be.visible")
      .should("contain.text", "Please check our Error guide and try again");

    cy.findByTestId("revalidate-transaction")
      .should("be.visible")
      .should("contain.text", "Try again")
      .click();
    cy.wait(3000);

    cy.findByTestId("revalidate-transaction")
      .should("be.visible")
      .should("contain.text", "Try again")
      .click();
    cy.wait(3000);

    // verifying again will return throttledTimeOut

    cy.findByTestId("verification-title")
      .should("be.visible")
      .should("contain.text", TitleLabel.ThrottleLimit);

    cy.findByTestId("verification-content")
      .should("be.visible")
      .should("contain.text", ContentLabel.ThrottleLimit);
    cy.wait(60000); // 1 minute timeout added to wait for throttling to be over
  });

  it("3. Verify form setup DFC -> ETH - Success", () => {
    proceedUntilStep(4);
    cy.wait(1000);
    cy.getTokenPairs(formData.tokenPair).then((pair) => {
      cy.findByTestId("claim-action-btn").click();
      cy.verifyConfirmationModal();

      //Reject
      cy.rejectMetamaskTransaction();
      cy.findByTestId("claim-err-title");
      cy.findByTestId("claim-err-close-btn").should("contain.text", "Close");
      cy.findByTestId("claim-err-action-btn")
        .should("contain.text", "Try again")
        .click();

      // Approve
      cy.confirmMetamaskTransaction();
      // Show successfully claimed modal
      cy.findByTestId("claim-success-modal").should("be.visible");
      cy.findByTestId("claim-success-msg").should(
        "contain.text",
        `You have successfully claimed your ${pair.tokenA} tokens.`
      );
      cy.findByTestId("view-etherscan-btn").should(
        "contain.text",
        "View on Etherscan"
      );
      cy.findByTestId("claim-success-modal-close-icon").click();

      // Form should restore to default
      cy.verifyFormPairing(true, Network.Ethereum, Network.DeFiChain, "DFI");
    });
  });
});

context("QA-770-11 Connected wallet - DFC > ETH - QR address expired", () => {
  it("1: Verify QR address expired able to generate new one", () => {
    proceedUntilStep(1);
    cy.getTokenPairs(formData.tokenPair).then((pair) => {
      cy.findByTestId("go-to-next-step-btn").click();

      // QA-770-11 intercept generate address expiring
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - 1);
      createdDate.setSeconds(createdDate.getSeconds() + 10);
      cy.log(`createdDate: ${createdDate.toISOString()}`);
      cy.intercept(
        "GET",
        `**/defichain/wallet/address/generate?refundAddress=${formData.refundAddress}`,
        {
          statusCode: HttpStatusCode.Ok,
          body: {
            address: "bcrt1qyeyf69gf8h4kfqh29z0w9thyrg6yj6p4lgswkk", //temporary dummy address
            createdAt: createdDate.toISOString(),
            refundAddress: formData.refundAddress,
          },
        }
      );
      // wait for address to expire
      cy.wait(15000);
      cy.findByTestId("verify-hot-wallet-transfer").should("be.disabled");
      cy.findByTestId("address-error-msg")
        .should("be.visible")
        .contains("Address has expired and is now unavailable for use");
      cy.findByTestId("generate-again-btn")
        .should("be.visible")
        .should("be.enabled")
        .contains("Generate again")
        .click();

      // wait for address to generate again
      cy.wait(2000);

      // verify Step 2
      // validating progress step
      cy.findByTestId("erc-transfer-step-two").should("be.visible");
      verifyStep(2);
      verifyStepTwoForm(pair);

      cy.findByTestId("verify-hot-wallet-transfer")
        .should("be.visible")
        .should("be.enabled")
        .click();

      // verify Step 3
      verifyStep(3);
    });
  });
});

context("QA-770-12 Connected wallet - DFC > ETH - Claim expired", () => {
  it("1: Verify claim expired ", () => {
    proceedUntilStep(2);

    // sending token to wallet
    sendTokenToWallet();
    // wait for transaction to be verified
    cy.wait(5000);
    // intercept verify api to change deadline
    const deadline = dayjs().add(10, "second").unix();
    cy.intercept("POST", "**/defichain/wallet/verify", {
      statusCode: HttpStatusCode.Ok,
      body: {
        deadline: deadline,
        isValid: true,
        nonce: 2,
        signature:
          "0x0000000000000000000000000000000000000000000000000000000000000000", //dummy
      },
    });

    cy.findByTestId("verify-hot-wallet-transfer").should("be.visible").click();

    // no controls over step 3 proceeding to step 4 here, step 3 is passing too fast, so no verification for step 3
    cy.wait(5000);

    // last step should show claim expired
    verifyStep(4);
    cy.findByTestId("claim-title")
      .should("be.visible")
      .should("contain.text", "Claim period has expired");

    cy.findByTestId("claim-content")
      .should("be.visible")
      .should(
        "contain.text",
        "Unfortunately you are now unable to claim any tokens from this transaction. Closing this modal will reset the form and allow you to start a new transaction."
      );

    cy.findByTestId("ready-for-claiming-timing").should("not.exist");
    cy.findByTestId("claim-action-btn")
      .should("be.visible")
      .should("contain.text", "Close")
      .click();

    // close expired claim modal
    cy.verifyUtilityModal({
      title: "Are you sure you want to leave your transaction?",
      message:
        "You may lose any pending transaction and funds related to it. This is irrecoverable, proceed with caution",
      primaryButtonLabel: "Leave transaction",
      secondaryButtonLabel: "Go back",
      clickButton: UtilityButtonType.PRIMARY,
    });

    // should return to form with form values remained
    cy.verifyFormPairing(
      true,
      formData.sourceNetwork,
      formData.destinationNetwork,
      formData.tokenPair,
      connectedWalletAddress,
      formData.amount
    );
  });
});
