describe("Maintenance", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });
  it("should display homepage when bridge is not down", () => {
    cy.intercept("GET", "**/bridge/status", {
      body: { isUp: true },
    });
    cy.findByTestId("homepage").should("exist");
    cy.findByTestId("maintenance").should("not.exist");
  });
  it("should display maintenance page when Quantum Bridge is down", () => {
    cy.intercept("GET", "**/bridge/status", {
      body: { isUp: false },
    });
    cy.findByTestId("homepage").should("not.exist");
    cy.findByTestId("maintenance").should("exist");
    cy.findByTestId("maintenance_title").contains("Bridge is currently closed");
  });
});
