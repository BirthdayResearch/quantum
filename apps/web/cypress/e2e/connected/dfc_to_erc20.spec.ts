/* eslint-disable cypress/no-unnecessary-waiting */
import { DfcToErcTransferSteps } from "../../../src/constants";
import { Erc20Token, Network } from "../../../src/types";

const formData = {
  sourceNetwork: Network.DeFiChain,
  destinationNetwork: Network.Ethereum,
  tokenPair: "USDT" as Erc20Token,
  amount: "0.4",
  destinationAddress: "bcrt1qamh07d09mhmym6ce7puftjgmwqqga2es7uzdzs",
};

before(() => {
  cy.visit("http://localhost:3000/?network=Local", {
    onBeforeLoad: (win) => {
      let nextData: any;
      Object.defineProperty(win, "__NEXT_DATA__", {
        set(o) {
          // Modify the injected parsed data
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

function validateStep(stepNumber: number) {
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

context("QA-770 Connected wallet - DFC > ETH - USDT", () => {
  let connectedWalletAddress: string;
  const fee = "0.0012";
  const toReceive = "0.3988";
  const transferToken = "dUSDT";

  beforeEach(() => {
    cy.connectMetaMaskWallet();
    cy.getMetamaskWalletAddress().then((address) => {
      if (address !== undefined) {
        connectedWalletAddress = address as string;
      }
    });
  });

  it("1: Verify form setup DFC -> ETH", () => {
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

    // verify source network
    cy.findByTestId("from-source-network-icon")
      .should("be.visible")
      .should("have.attr", "alt", "DeFiChain")
      .should("have.attr", "src", "/tokens/DeFichain.svg");
    cy.findByTestId("from-source-address").should(
      "contain.text",
      "DeFiChain address"
    );
    // verify source data token to send
    cy.findByTestId("from-source-amount").should(
      "contain.text",
      formData.amount
    );
    cy.findByTestId("from-source-token-icon")
      .should("have.attr", "alt", transferToken)
      .should("have.attr", "src", `/tokens/${transferToken}.svg`);
    cy.findByTestId("from-source-token-name").should(
      "contain.text",
      transferToken
    );

    // verify destination network
    cy.findByTestId("to-destination-network-icon")
      .should("have.attr", "alt", "Ethereum")
      .should("have.attr", "src", "/tokens/Ethereum.svg");
    cy.findByTestId("to-destination-address").should(
      "contain.text",
      connectedWalletAddress
    );

    // verify destination data token to receive
    cy.findByTestId("to-destination-token-icon")
      .should("have.attr", "alt", formData.tokenPair)
      .should("have.attr", "src", `/tokens/${formData.tokenPair}.svg`);
    cy.findByTestId("to-destination-token-name").should(
      "contain.text",
      formData.tokenPair
    );

    cy.findByTestId("to-destination-network-name").should(
      "contain.text",
      "Destination (Ethereum)"
    );
    cy.findByTestId("to-destination-amount").should("contain.text", toReceive);

    cy.findByTestId("transaction-fees-amount").should(
      "contain.text",
      `${fee} ${transferToken}`
    );

    // verify erc-transfer-step-one
    cy.findByTestId("erc-transfer-procedure").should("be.visible");
    cy.findByTestId("erc-transfer-procedure").should("be.visible");
    cy.findByTestId("erc-transfer-progress").should("be.visible");

    // verify step 1
    // validating progress step
    validateStep(1);

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
    validateStep(2);

    cy.wait(600); // to wait for QR code to load
    cy.findByTestId("temp-defichain-sending-qr-address").should("be.visible");
    cy.findByTestId("temp-defichain-sending-address").should("be.visible");

    cy.findByTestId("transact-token-amount")
      .should("be.visible")
      .should("contain.text", formData.amount);

    cy.findByTestId("transact-token-logo")
      .should("be.visible")
      .should("have.attr", "alt", transferToken)
      .should("have.attr", "src", `/tokens/${transferToken}.svg`);

    cy.findByTestId("transact-token-name")
      .should("be.visible")
      .should("contain.text", transferToken);

    cy.findByTestId("temp-defichain-sending-text")
      .invoke("text")
      .then((text) => {
        cy.sendTokenToWallet(text, formData.amount, formData.tokenPair);
      });

    cy.wait(1000); // to give time for the send verification
    cy.findByTestId("verify-hot-wallet-transfer").should("be.visible").click();

    cy.findByTestId("ready-for-claiming-modal").should("exist");
    cy.wait(1000);
  });
});
