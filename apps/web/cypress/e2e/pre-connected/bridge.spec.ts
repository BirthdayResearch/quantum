// TODO: Mock wallet data

import { Network } from "../../../src/types";

beforeEach(() => {
  cy.visitBridgeHomePage();
});

context("QA-755-5~16 Pre-connected wallet - Bridge Form", () => {
  const source = Network.Ethereum;
  const destination = Network.DeFiChain;
  const currentPair = "DFI";

  it("1: Verify the Bridge form is visible", () => {
    cy.findByTestId("bridge-form").should("be.visible");
  });

  it("2: Verify form initial state", () => {
    // verify pairing
    cy.verifyFormPairing(false, source, destination, currentPair);

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
    cy.verifyFormPairing(false, destination, source, currentPair);
  });

  it("5: Verify HW balance", () => {
    cy.verifyHotWalletBalance();
  });
});

context("QA-755-3 Pre-connected wallet - Hover", () => {
  it("QA-755-3: Form icons hover", () => {
    cy.verifyFormHover(false);
  });
});
