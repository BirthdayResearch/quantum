import { LOCAL_BASE_ENDPOINT, QuantumHelperLinks } from "../../support/utils";

beforeEach(() => {
  cy.visitBridgeHomePage();
});

context("QA-755 Pre-connected - Navigational", () => {
  it("QA-755-2-1: Verify Documentation and FAQs links", () => {
    QuantumHelperLinks.forEach((QuantumHelperLink) => {
      cy.verifyExternalLinks(QuantumHelperLink);
    });
  });

  it("QA-755-2-2: Verify Quantum logo redirection", () => {
    cy.findByTestId("quantum-logo-header").should("be.visible").click();
    cy.url().should("equal", LOCAL_BASE_ENDPOINT);
  });

  it("QA-755-4: Verify social links", () => {
    cy.verifySocialLinks();
  });
});
