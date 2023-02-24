// TODO: Mock wallet data

describe("Bridge from Ethereum to DeFiChain", () => {
  it("should connect to MetaMask wallet", () => {
    cy.visit("http://localhost:3000");
    cy.contains("Connect wallet").should("exist");
  });

  it("should be able to bridge funds from Ethereum to DeFiChain", () => {
    cy.visit("http://localhost:3000");
    cy.findByTestId("amount").type("0.01").blur();
    // Temp remove for Testnet testing
    // cy.findByTestId("network-env-switch").click().contains("Playground"); // TODO: Replace `Playground` with `TestNet` once MainNet is ready
    cy.findByTestId("receiver-address").should("exist");
    cy.findByTestId("transfer-btn").should("exist");
    // TODO: Check confirm form fields
  });
});
