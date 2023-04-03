/* eslint-disable cypress/no-unnecessary-waiting */
import { DfcToErcTransferSteps } from "../../../src/constants";
import { Erc20Token, Network } from "../../../src/types";

beforeEach(() => {
  cy.visitBridgeHomePage();
});

const formData = {
  sourceNetwork: Network.DeFiChain,
  destinationNetwork: Network.Ethereum,
  tokenPair: "USDT" as Erc20Token,
  amount: "0.4",
  destinationAddress: "bcrt1qr3d3d0pdcw5as77crdy6pchh7j7xy4pfyhg64d",
};

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
      // Verify step node
      cy.findByTestId("step-node")
        .should("have.class", stepNumber > step ? "bg-valid" : "bg-dark-100")
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
          stepNumber === step ? "text-dark-1000" : "text-dark-500"
        )
        .should("contain.text", label);
    });
  });
}

context("QA-770-1 Connected wallet - DFC > ETH - USDT", () => {
  let connectedWalletAddress: string;
  const fee = "0.0012";
  const toReceive = "0.3988";

  beforeEach(() => {
    cy.connectMetaMaskWallet();
    cy.getMetamaskWalletAddress().then((address) => {
      if (address !== undefined) {
        connectedWalletAddress = address as string;
      }
    });
  });

  it("1. Verify reset form functionality : DFC -> ETH", () => {
    // bridge form setup
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
      // formData.destinationAddress
      connectedWalletAddress
    );
  });

  it("2. Verify form setup DFC -> ETH - Transfer not verified (not sending any token)", () => {
    // bridge form setup
    cy.setupBridgeForm(
      true,
      formData.sourceNetwork,
      formData.tokenPair,
      formData.amount,
      formData.destinationAddress
    );

    // verify review button state
    cy.findByTestId("transfer-btn").click();
    cy.findByTestId("transaction-review-modal").should("be.visible");
    cy.findByTestId("transaction-review-modal-title").should(
      "contain.text",
      "Review transaction"
    );

    cy.verifyConfirmTransferModal(
      formData.sourceNetwork,
      formData.tokenPair,
      formData.amount,
      toReceive,
      fee,
      connectedWalletAddress
    );

    cy.getTokenPairs(formData.tokenPair).then((pair) => {
      // verify erc-transfer-step-one
      cy.findByTestId("erc-transfer-procedure").should("be.visible");
      cy.findByTestId("erc-transfer-procedure").should("be.visible");
      cy.findByTestId("erc-transfer-progress").should("be.visible");

      // verify step 1
      // validating progress step
      verifyStep(1);

      cy.findByTestId("erc-transfer-step-one").should("be.visible");

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
      cy.findByTestId("defichain-address-input").type(
        formData.destinationAddress
      );
      cy.findByTestId("wallet-address-input-verified-badge").should("exist"); // verify badge functionality
      cy.findByTestId("go-to-next-step-btn").click();

      cy.findByTestId("erc-transfer-step-two").should("be.visible");

      // verify Step 2
      // validating progress step
      verifyStep(2);

      cy.wait(600); // to wait for QR code to load
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

      cy.findByTestId("verify-hot-wallet-transfer")
        .should("be.visible")
        .click();

      verifyStep(3);

      cy.findByTestId("erc-transfer-step-three").should("be.visible");

      // verify  will fail
      cy.findByTestId("verification-title")
        .should("be.visible")
        .should("contain.text", TitleLabel.Validating);

      cy.findByTestId("verification-content")
        .should("be.visible")
        .should("contain.text", ContentLabel.Validating);

      cy.wait(6000);

      cy.findByTestId("revalidate-transaction")
        .should("be.visible")
        .should("contain.text", "Try again")
        .click();
      cy.wait(6000);

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
      cy.wait(6000);

      // verifying again will return throttledTimeOut

      cy.findByTestId("verification-title")
        .should("be.visible")
        .should("contain.text", TitleLabel.ThrottleLimit);

      cy.findByTestId("verification-content")
        .should("be.visible")
        .should("contain.text", ContentLabel.ThrottleLimit);
      cy.wait(60000); // 1 minute timeout added to wait for throttling to be over
    });
  });

  it("3. Verify form setup DFC -> ETH - Success", () => {
    // bridge form setup
    cy.setupBridgeForm(
      true,
      formData.sourceNetwork,
      formData.tokenPair,
      formData.amount,
      formData.destinationAddress
    );

    // verify review button state
    cy.findByTestId("transfer-btn").click();
    cy.findByTestId("transaction-review-modal").should("be.visible");
    cy.findByTestId("transaction-review-modal-title").should(
      "contain.text",
      "Review transaction"
    );

    cy.verifyConfirmTransferModal(
      formData.sourceNetwork,
      formData.tokenPair,
      formData.amount,
      toReceive,
      fee,
      connectedWalletAddress
    );

    cy.getTokenPairs(formData.tokenPair).then((pair) => {
      // verify erc-transfer-step-one
      cy.findByTestId("erc-transfer-procedure").should("be.visible");
      cy.findByTestId("erc-transfer-progress").should("be.visible");

      // verify step 1
      // validating progress step
      verifyStep(1);

      cy.findByTestId("erc-transfer-step-one").should("be.visible");

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
      cy.findByTestId("defichain-address-input").type(
        formData.destinationAddress
      );
      cy.findByTestId("wallet-address-input-verified-badge").should("exist"); // verify badge functionality
      cy.findByTestId("go-to-next-step-btn").click();

      cy.findByTestId("erc-transfer-step-two").should("be.visible");

      // verify Step 2
      // validating progress step
      verifyStep(2);

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

      // sending token to wallet
      cy.findByTestId("temp-defichain-sending-text")
        .invoke("text")
        .then((text) => {
          cy.sendTokenToWallet(text, formData.amount, formData.tokenPair);
        });

      cy.wait(10000); // wait for transaction to be verified

      cy.findByTestId("verify-hot-wallet-transfer")
        .should("be.visible")
        .click();

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
      cy.wait(1000);
    });
  });
});
