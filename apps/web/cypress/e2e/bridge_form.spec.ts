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

describe("Bridge form", () => {
  it("Verify the Bridge form is visible", () => {
    cy.findByTestId("bridge-form").should("be.visible");
  });

  it("Should show original state of bridge form", () => {
    // Source Network
    cy.findByTestId("source-network-input").should("be.visible");
    cy.findByTestId("selected-source-network-Ethereum")
      .should("be.visible")
      .should("contain.text", "Ethereum");
    cy.findByTestId("selected-source-network-Ethereum-logo").should(
      "be.visible"
    );

    // Token A
    cy.findByTestId("tokenA-input").should("be.visible");
    cy.findByTestId("selected-tokenA-WBTC")
      .should("be.visible")
      .should("contain.text", "WBTC");
    cy.findByTestId("selected-tokenA-WBTC-logo").should("be.visible");

    // Destination Network
    cy.findByTestId("destination-network-input").should("be.visible");
    cy.findByTestId("selected-destination-network-DeFiChain")
      .should("be.visible")
      .should("contain.text", "DeFiChain");
    cy.findByTestId("selected-destination-network-DeFiChain-logo").should(
      "be.visible"
    );

    // Token B
    cy.findByTestId("tokenB-input").should("be.visible");
    cy.findByTestId("selected-tokenB-dBTC")
      .should("be.visible")
      .should("contain.text", "dBTC");
    cy.findByTestId("selected-tokenB-dBTC-logo").should("be.visible");

    cy.findByTestId("quick-input-card").should("be.visible");
    cy.findByTestId("quick-input-card-set-btn").should("be.visible");
  });

  it("Should show Switch button and verify it functionality", () => {
    cy.findByTestId("transfer-flow-swap-btn").should("be.visible").click();

    cy.findByTestId("selected-source-network-DeFiChain")
      .should("be.visible")
      .should("contain.text", "DeFiChain");

    cy.findByTestId("selected-tokenA-dBTC")
      .should("be.visible")
      .should("contain.text", "dBTC");
    cy.findByTestId("selected-tokenA-dBTC-logo").should("be.visible");

    cy.findByTestId("selected-destination-network-Ethereum")
      .should("be.visible")
      .should("contain.text", "Ethereum");
    cy.findByTestId("selected-tokenB-WBTC-logo").should("be.visible");
  });

  it("Should only show total liquidity amount if wallet is connected", () => {
    cy.findByTestId("available-liquidity").should("not.exist");

    // connect metamask
    cy.connectMetaMaskWallet();
    cy.findByTestId("available-liquidity")
      .should("exist")
      .should("contain.text", "Available:");
  });

  it("Should only allow 6pt for input", () => {
    cy.findByTestId("quick-input-card-set-amount")
      .should("be.visible")
      .type("123.456789")
      .should("have.value", "123.45678"); // TODO:: How should we generate random input and check with regex
  });
});
