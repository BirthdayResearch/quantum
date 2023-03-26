// TODO: Mock wallet data

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

/**
 * @description Validates the form pairing of the source and destination networks.
 * @param {string} source - The source network (e.g., "Ethereum").
 * @param {string} destination - The destination network (e.g., "DeFiChain").
 * @returns {void}
 * @example
 * validateFormPairing("Ethereum", "DeFiChain");
 */
function validateFormPairing(source: string, destination: string): void {
  // source network
  cy.findByTestId("source-network-input").should("be.visible");
  cy.findByTestId(`selected-source-network-${source}`)
    .should("be.visible")
    .should("contain.text", source);
  cy.findByTestId(`selected-source-network-${source}-logo`).should(
    "be.visible"
  );

  // verify network env visibility
  cy.findByTestId("network-env-switch").should(
    source === "Ethereum" ? "exist" : "not.exist"
  );

  if (source === "Ethereum") {
    cy.findByTestId("network-env-switch").contains("Local"); // TODO: dynamic network env
  }

  // destination network
  cy.findByTestId("destination-network-input").should("be.visible");
  cy.findByTestId(`selected-destination-network-${destination}`)
    .should("be.visible")
    .should("contain.text", destination);
  cy.findByTestId(`selected-destination-network-${destination}-logo`).should(
    "be.visible"
  );

  // Reciver address
  cy.findByTestId("receiver-address").should("be.visible");
  cy.findByTestId("receiver-address-input")
    .should("be.disabled")
    .invoke("attr", "placeholder")
    .then((actualPlaceholder) => {
      expect(actualPlaceholder).to.equal(`Enter ${destination} address`);
    });
}

context("QA-755 Pre-connected wallet - Bridge Form", () => {
  it("1: Verify the Bridge form is visible", () => {
    cy.findByTestId("bridge-form").should("be.visible");
  });

  it("2: Verify form initial state", () => {
    const source = "Ethereum";
    const destination = "DeFiChain";

    // verify pairing
    validateFormPairing(source, destination);

    // Action button
    cy.findByTestId("transfer-btn")
      .should("be.visible")
      .should("be.disabled")
      .contains("Connect wallet");
  });

  it("3: Verify swap network functionality", () => {
    const source = "Ethereum";
    const destination = "DeFiChain";

    // swapping destination and source
    cy.findByTestId("transfer-flow-swap-btn").should("be.visible").click();
    // verify pairing
    validateFormPairing(destination, source);
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
