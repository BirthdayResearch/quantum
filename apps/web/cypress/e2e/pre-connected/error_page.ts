beforeEach(() => {
  cy.visitBridgeHomePage();
});

context("QA-799 Pre-connected - Error handling", () => {
  it("QA-799-2: Verify error 404 page", () => {
    cy.verify404Page();
  });

  it("QA-799-5: Verify maintenance page", () => {
    cy.verifyMaintenancePage();
  });
});
