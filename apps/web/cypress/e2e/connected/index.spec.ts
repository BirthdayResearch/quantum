import { LOCAL_BASE_URL, QuantumHelperLinks } from "../../support/utils";

beforeEach(() => {
  cy.visitBridgeHomePage();
  cy.connectMetaMaskWallet();
});

context("QA-769 Connected Wallet - Guides", () => {
  it("QA-769-2-1: Verify Documentation and FAQs links", () => {
    QuantumHelperLinks.forEach((QuantumHelperLink) => {
      cy.verifyExternalLinks(QuantumHelperLink);
    });
  });

  it("QA-769-2-2: Verify Quantum logo redirection", () => {
    cy.findByTestId("quantum-logo-header").should("be.visible").click();
    cy.url().should("equal", LOCAL_BASE_URL);
  });

  it("QA-769-4: Verify social links", () => {
    cy.verifySocialLinks();
  });
});
