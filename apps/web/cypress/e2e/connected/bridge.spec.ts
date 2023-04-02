import truncateTextFromMiddle from "../../../src/utils/textHelper";
import { Network } from "../../../src/types";

beforeEach(() => {
  cy.visitBridgeHomePage();
});

describe("QA-769-1 Connected wallet - Connect wallet", () => {
  it("QA-769-1-1 should show connect wallet popup", () => {
    cy.verifyConnectWalletPopUp();
  });

  it("QA-769-1-2~3 should verify wallet connected button state", () => {
    cy.connectMetaMaskWallet();
    cy.findByTestId("wallet-button").should("be.visible");
    cy.getMetamaskWalletAddress().then((address) => {
      if (address !== undefined) {
        cy.findByTestId("connected_wallet_add").should(
          "contain.text",
          truncateTextFromMiddle(address as string, 5)
        );
      }
    });

    cy.findByTestId("connected_env").should("contain.text", "Localhost");
    cy.findByTestId("network-env-switch")
      .should("be.disabled")
      .should("contain.text", "Local");

    // verify pairing
    cy.validateFormPairing(true, Network.Ethereum, Network.DeFiChain, "DFI");
  });
});

context("QA-769-3 Connected wallet - Hover", () => {
  it("QA-769-3: Verify form icons hovers", () => {
    cy.connectMetaMaskWallet();
    cy.verifyFormHover(true);
  });
});

context("QA-769-7~12 Connected wallet - Bridge Form", () => {
  const source = Network.Ethereum;
  const destination = Network.DeFiChain;
  const currentPair = "DFI";

  it("1: Verify the Bridge form is visible", () => {
    cy.findByTestId("bridge-form").should("be.visible");
  });

  it("2: Verify form initial state", () => {
    // verify pairing
    cy.validateFormPairing(false, source, destination, currentPair);

    // action button
    cy.findByTestId("transfer-btn")
      .should("be.visible")
      .contains("Connect wallet");

    cy.findByTestId("transaction-interrupted-msg").should("not.exist");
  });

  it("3: Verify amount input functionality", () => {
    cy.findByTestId("quick-input-card").should("be.visible");
    cy.findByTestId("quick-input-card-set-amount")
      .type("0.12345678")
      .should("have.value", "0.12345")
      .clear()
      .type("123456789")
      .should("have.value", "123456789")
      .clear();
  });

  it("4: Verify swap network functionality", () => {
    // swapping destination and source
    cy.findByTestId("transfer-flow-swap-btn").should("be.visible").click();
    // verify pairing
    cy.validateFormPairing(false, destination, source, currentPair);
  });

  it("5: Verify HW balance", () => {
    cy.verifyHotWalletBalance();
  });
});

context("QA-799-1 Disconnect wallet", () => {
  it("1: Verify disconnect", () => {
    cy.connectMetaMaskWallet();
    cy.findByTestId("wallet-button").should("be.visible");
    cy.disconnectMetaMaskWallet();
    cy.validateFormPairing(false, Network.Ethereum, Network.DeFiChain, "DFI");
  });
});
