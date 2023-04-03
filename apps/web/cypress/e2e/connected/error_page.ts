beforeEach(() => {
  cy.visitBridgeHomePage();
  cy.connectMetaMaskWallet();
});

context("QA-799 Connected wallet - Error handling", () => {
  it("QA-799-3: Verify error 404 page", () => {
    cy.verify404Page();
  });

  it("QA-799-5: Verify maintenance page", () => {
    cy.verifyMaintenancePage();
  });
});
