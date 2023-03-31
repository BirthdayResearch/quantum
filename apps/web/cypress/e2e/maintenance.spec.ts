describe("Maintenance", () => {
  it("should display homepage when bridge is not down", () => {
    cy.visitBridgeHomePage();
    cy.findByTestId("homepage").should("exist");
    cy.findByTestId("maintenance").should("not.exist");
  });

  it("should display maintenance page when Quantum Bridge is down", () => {
    cy.visitBridgeHomePage(false);
    cy.findByTestId("homepage").should("not.exist");
    cy.findByTestId("maintenance").should("exist");
    cy.findByTestId("maintenance_title").contains("Bridge is currently closed");
  });
});
