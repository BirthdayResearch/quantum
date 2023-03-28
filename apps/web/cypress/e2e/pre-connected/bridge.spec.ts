// TODO: Mock wallet data

import { Network } from "../../../src/types";

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

context("QA-755 Pre-connected wallet - Bridge Form", () => {
  const source = Network.Ethereum;
  const destination = Network.DeFiChain;
  const currentPair = "WBTC";

  it("1: Verify the Bridge form is visible", () => {
    cy.findByTestId("bridge-form").should("be.visible");
  });

  it("2: Verify form initial state", () => {
    // verify pairing
    cy.validateFormPairing(source, destination, currentPair);

    // action button
    cy.findByTestId("transfer-btn")
      .should("be.visible")
      .should("be.disabled")
      .contains("Connect wallet");
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

  it.only("4: Verify swap network functionality", () => {
    // swapping destination and source
    cy.findByTestId("transfer-flow-swap-btn").should("be.visible").click();
    // verify pairing
    cy.validateFormPairing(destination, source, currentPair);
  });
});

// describe("Bridge from Ethereum to DeFiChain", () => {
//   it("should be able to connect to metamask wallet", () => {
//     cy.findByTestId("connect-button").should("be.visible");
//     cy.connectMetaMaskWallet();
//     cy.findByTestId("wallet-button").should("be.visible");
//   });

//   it("should be able to bridge funds from Ethereum to DeFiChain", () => {
//     cy.connectMetaMaskWallet();
//     cy.findByTestId("amount").type("0.01").blur();
//     // Temp remove for Testnet testing
//     // cy.findByTestId("network-env-switch").click().contains("Playground"); // TODO: Replace `Playground` with `TestNet` once MainNet is ready
//     cy.findByTestId("receiver-address").should("exist");
//     cy.findByTestId("transfer-btn").should("exist");
//     // TODO: Check confirm form fields
//   });

//   it("should be able to disconnect from metamask wallet", () => {
//     cy.connectMetaMaskWallet();
//     cy.findByTestId("wallet-button").should("be.visible");
//     cy.disconnectMetaMaskWallet();
//     cy.findByTestId("connect-button").should("be.visible");
//   });
// });
