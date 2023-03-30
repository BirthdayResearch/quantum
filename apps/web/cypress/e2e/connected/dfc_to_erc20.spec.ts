/* eslint-disable cypress/no-unnecessary-waiting */
import { DfcToErcTransferSteps } from "../../../src/constants";
import { Erc20Token, Network } from "../../../src/types";

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

const formData = {
  sourceNetwork: Network.DeFiChain,
  destinationNetwork: Network.Ethereum,
  tokenPair: "USDT" as Erc20Token,
  amount: "0.4",
  destinationAddress: "bcrt1qr3d3d0pdcw5as77crdy6pchh7j7xy4pfyhg64d",
};

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

describe("QA-770-1 Connected wallet - DFC > ETH - USDT", () => {
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

  it("1. Verify reset form functionality : DFC -> ETH", () => {
    // bridge form setup
    cy.setupBridgeForm(
      true,
      formData.sourceNetwork,
      formData.tokenPair,
      formData.amount,
      formData.destinationAddress
    );

    // test reset form
    cy.verifyResetFormFunctionality();
  });

  it("2. Verify form setup DFC -> ETH", () => {
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

    cy.validateConfirmTransferModal(
      formData.sourceNetwork,
      formData.tokenPair,
      formData.amount,
      toReceive,
      fee,
      connectedWalletAddress
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
