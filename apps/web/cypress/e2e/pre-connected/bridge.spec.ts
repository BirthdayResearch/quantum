// TODO: Mock wallet data

const TokensPair = [
  { tokenA: "WBTC", tokenB: "dBTC" },
  { tokenA: "ETH", tokenB: "dETH" },
  { tokenA: "USDT", tokenB: "dUSDT" },
  { tokenA: "USDC", tokenB: "dUSDC" },
  { tokenA: "EUROC", tokenB: "dEUROC" },
];

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

// Helper function to swap pairs
function swapTokenPositions(
  pairs: { tokenA: string; tokenB: string }[]
): { tokenA: string; tokenB: string }[] {
  return pairs.map((pair) => {
    const { tokenA, tokenB } = pair;
    return { tokenA: tokenB, tokenB: tokenA };
  });
}

// helper function to validate dropdown tokens selection
function validateDropdownTokenSelection(erc20ToDfc = true) {
  const tokensPairing = erc20ToDfc
    ? TokensPair
    : swapTokenPositions(TokensPair);
  // check if all token exist
  // iterate through the TokensPairing
  tokensPairing.forEach((pair) => {
    const { tokenA, tokenB } = pair;
    cy.findAllByTestId(`token-pair-to-send-${tokenA}`).should("exist");
    cy.findAllByTestId(`token-pair-to-receive-${tokenB}`).should("exist");
  });
  cy.findByTestId("token-pair-dropdown-btn").click(); // to close the dropdown
}

// helper function to validate token pair
function validateTokenPair(tokenToSend: string, tokenToReceive: string) {
  cy.findByTestId(`token-pair-input`)
    .should("be.visible")
    .should("contain.text", "Token");
  cy.findByTestId("token-pair-dropdown-btn")
    .should("have.attr", "aria-haspopup", "listbox")
    .should("have.attr", "aria-expanded", "false")
    .should("contain.text", tokenToSend);
  cy.findByTestId(`selected-token-pair-${tokenToSend}-logo`).should(
    "be.visible"
  );

  cy.findByTestId("token-to-receive-input")
    .should("be.visible")
    .should("contain.text", "Token to Receive");
  cy.findByTestId("token-to-receive-dropdown-btn").should(
    "contain.text",
    tokenToReceive
  );
  cy.findByTestId(`selected-token-to-receive-${tokenToReceive}-logo`).should(
    "be.visible"
  );
}

// helper function to validate a network
function validateNetwork(networkType: string, networkName: string) {
  const networkTypeLowerCase = networkType.toLowerCase();
  cy.findByTestId(`${networkTypeLowerCase}-network-input`)
    .should("be.visible")
    .should("contain.text", `${networkType} Network`);
  cy.findByTestId(`${networkTypeLowerCase}-network-dropdown-btn`)
    .should("be.visible")
    .should("contain.text", networkName)
    .should("have.attr", "aria-haspopup", "listbox")
    .should("have.attr", "aria-expanded", "false");
  cy.findByTestId(
    `selected-${networkTypeLowerCase}-network-${networkName}-logo`
  ).should("be.visible");
}

/**
 * @description Validates the form pairing of the source and destination networks.
 * @param {string} source - The source network (e.g., "Ethereum").
 * @param {string} destination - The destination network (e.g., "DeFiChain").
 * @param {{ tokenA: string; tokenB: string }} tokenPair - An object containing the token pair (e.g., { tokenA: "USDT", tokenB: "dUSDT" }).
 * @returns {void}
 * @example
 * validateFormPairing("Ethereum", "DeFiChain");
 */
function validateFormPairing(
  source: string,
  destination: string,
  tokenPair: { tokenA: string; tokenB: string }
): void {
  const erc20ToDfc = source === "Ethereum" && destination === "DeFiChain"; // double typed check
  const { tokenA, tokenB } = tokenPair;

  const tokenToSend = erc20ToDfc ? tokenA : tokenB;
  const tokeToReceive = erc20ToDfc ? tokenB : tokenA;

  // source network validation
  validateNetwork("Source", source);
  validateTokenPair(tokenToSend, tokeToReceive);

  // verify token pair dropdown
  cy.findByTestId("token-pair-dropdown-btn")
    .click()
    .should("have.attr", "aria-expanded", "true");
  cy.findByTestId("token-pair-dropdown-options")
    .should("be.visible")
    .should("contain.text", "Select token");
  validateDropdownTokenSelection(erc20ToDfc);

  // verify network env visibility
  cy.findByTestId("network-env-switch").should(
    erc20ToDfc ? "exist" : "not.exist"
  );

  if (erc20ToDfc) {
    cy.findByTestId("network-env-switch").contains("Local"); // TODO: dynamic network env
  }

  // destination network validation
  validateNetwork("Destination", destination);
  validateTokenPair(tokenToSend, tokeToReceive);

  // reciver address
  cy.findByTestId("receiver-address").should("be.visible");
  cy.findByTestId("receiver-address-input")
    .should("be.disabled")
    .invoke("attr", "placeholder")
    .then((actualPlaceholder) => {
      expect(actualPlaceholder).to.equal(`Enter ${destination} address`);
    });
}

context("QA-755 Pre-connected wallet - Bridge Form", () => {
  const source = "Ethereum";
  const destination = "DeFiChain";
  const currentPair = { tokenA: "WBTC", tokenB: "dBTC" };

  it("1: Verify the Bridge form is visible", () => {
    cy.findByTestId("bridge-form").should("be.visible");
  });

  it("2: Verify form initial state", () => {
    // verify pairing
    validateFormPairing(source, destination, currentPair);

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

  it("4: Verify swap network functionality", () => {
    // swapping destination and source
    cy.findByTestId("transfer-flow-swap-btn").should("be.visible").click();
    // verify pairing
    validateFormPairing(destination, source, currentPair);
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
