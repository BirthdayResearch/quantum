import "@testing-library/cypress/add-commands";
import { Erc20Token, Network } from "../../src/types";
/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * @description Custom command to select DOM element by data-testid attribute.
       * @example cy.getByTestID('home_button')
       */
      getByTestID: (value: string, opts?: any) => Chainable<Element>;

      /**
       * @description Connect to MetaMask Wallet
       * @example cy.connectMetaMaskWallet()
       */
      connectMetaMaskWallet: () => Chainable<Element>;

      /**
       * @description Disconnect from MetaMask Wallet
       * @example cy.disconnectMetaMaskWallet()
       */
      disconnectMetaMaskWallet: () => Chainable<Element>;

      /**
       * @description Quick setup for bridge form
       * @param {isMetamaskConnected} boolean - Flag to check if metamask acc is connected
       * @param {Network} sourceNetwork to be bridge from, Ethereum or DeFiChain
       * @param {Erc20Token} tokenPair to be sent and receive from bridge
       * @param {string} amount to be sent
       * @param {string} destinationAddress to be sent to
       * @example cy.setupBridgeForm(true, Network.Ethereum, "WBTC", "0.001")
       */
      setupBridgeForm: (
        isMetamaskConnected: boolean,
        sourceNetwork: Network,
        tokenPair: Erc20Token,
        amount?: string,
        destinationAddress?: string
      ) => Chainable<{ evmAddress: string }>;

      /**
       * @description Set feature flags
       * @param {string[]} flags to be set
       * @example cy.setFeatureFlags(['feature_a', 'feature_b'], 'beta')
       */
      setFeatureFlags: (flags: string[], stage?: string) => Chainable<Element>;

      /**
       * @description Verifies the visibility and correctness of external links using their test IDs and URLs.
       * @param {Object} extLink - The object containing the test ID and URL of the external link.
       * @param {string} extLink.testId - The data-test-id attribute value for the external link.
       * @param {string} extLink.url - The URL of the external link.
       * @example
       * cy.verifyExternalLinks({
       *   testId: "documentation-link",
       *   url: "https://example.com/documentation",
       * });
       */
      verifyExternalLinks: (extLink: {
        testId: string;
        url: string;
      }) => Chainable<Element>;

      /**
       * @description Helper function to validate dropdown tokens selection
       * @param {boolean} erc20ToDfc - Flag to determine the direction of bridging
       * @example cy.validateDropdownTokenSelection(true)
       */
      validateDropdownTokenSelection: (
        erc20ToDfc: boolean
      ) => Chainable<Element>;

      /**
       * @description Helper function to validate token pair
       * @param {string} tokenToSend - Token being sent to bridge
       * @param {string} tokenToReceive - Token to receive from bridge
       * @example cy.validateTokenPair("WBTC", "dBTC")
       */
      validateTokenPair: (
        tokenToSend: string,
        tokenToReceive: string
      ) => Chainable<Element>;

      /**
       * @description Helper function to validate network
       * @param {"Source"|"Destination"} networkType - Type of network (e.g., "Source", "Destination")
       * @param {Network} networkName - Name of network (e.g., "Ethereum", "DeFiChain")
       * @example cy.validateNetwork("Source", Network.Ethereum")
       */
      validateNetwork: (
        networkType: "Source" | "Destination",
        networkName: Network
      ) => Chainable<Element>;

      /**
       * @description Validates the form pairing of the source and destination networks.
       * @param {isMetamaskConnected} boolean - Flag to check if metamask acc is connected
       * @param {Network} source - The source network (e.g., "Ethereum").
       * @param {Network} destination - The destination network (e.g., "DeFiChain").
       * @param {Erc20Token} tokenPair - An object containing the token pair (e.g., { tokenA: "USDT", tokenB: "dUSDT" }).
       * @example
       * validateFormPairing(true, "Ethereum", "DeFiChain");
       */
      validateFormPairing: (
        isMetamaskConnected: boolean,
        source: Network,
        destination: Network,
        tokenPair: Erc20Token
      ) => Chainable<Element>;

      /**
       * @description Custom hardhat request
       * @param {string} method - Method to call in hardhat
       * @param {any[]} params - Any configurable params to pass
       * @example
       * hardhatRequest("evm_mine", [{blocks: 5}]);
       */
      hardhatRequest: (method: string, params: any[]) => Chainable<Element>;

      /**
       * @description Get token pairs of each source and destination
       * @param {Erc20Token} token - Token symbol
       * @return {{tokenA: string, tokenB: string}} - Token pair returned
       * @example
       * getTokenPairs("WBTC");
       */
      getTokenPairs: (
        token: Erc20Token
      ) => Chainable<{ tokenA: string; tokenB: string }>;

      /**
       * @description Helper function to validate utility modal
       * @param {string} title display on modal
       * @param {string} message displayed on modal
       * @param {string} primaryButtonLabel displayed on modal
       * @param {string} secondaryButtonLabel displayed on modal
       * @example
       * validateUtilityModal("Error", "Something went wrong", "Try again", "Close");
       */
      validateUtilityModal: (
        title: string,
        message: string,
        primaryButtonLabel: string,
        secondaryButtonLabel: string
      ) => Chainable<Element>;

      /**
       * @description Helper function to validate locked form
       * @param {Network} sourceNetwork to be bridge from
       * @param {Network} destinationNetwork to bridge to
       * @param {Erc20Token} tokenPair to be sent and receive from bridge
       * @param {string} amount to be sent
       * @param {string} destinationAddress to receive the token amount
       * @example
       * validateLockedForm(Network.Ethereum, Network.DeFiChain, "WBTC", "0.001", "xxxxxxx");
       */
      validateLockedForm: (
        sourceNetwork: Network,
        destinationNetwork: Network,
        tokenPair: Erc20Token,
        amount: string,
        destinationAddress: string
      ) => Chainable<Element>;

      /**
       * @description Sends token to wallet. Accepts a list of token symbols to be sent.
       * @param {string[]} tokens to be sent
       * @param {string} amount to be sent
       * @param {Erc20Token} token to be sent
       * @example cy.sendTokenToWallet(['BTC', 'ETH']).wait(4000)
       */
      sendTokenToWallet: (
        params: any,
        amount: string,
        token: Erc20Token
      ) => Chainable<Element>;
    }
  }
}

const TokensPair = [
  { tokenA: "DFI", tokenB: "DFI" },
  { tokenA: "WBTC", tokenB: "dBTC" },
  { tokenA: "ETH", tokenB: "dETH" },
  { tokenA: "USDT", tokenB: "dUSDT" },
  { tokenA: "USDC", tokenB: "dUSDC" },
  { tokenA: "EUROC", tokenB: "dEUROC" },
];

Cypress.Commands.add("connectMetaMaskWallet", () => {
  cy.disconnectMetamaskWalletFromDapp(); // in case it's not fully disconnected, else cy.acceptMetamaskAccess() will throw error
  cy.findByTestId("connect-button").click();
  cy.contains("MetaMask").click();
  cy.acceptMetamaskAccess().should("be.true");
});

Cypress.Commands.add("disconnectMetaMaskWallet", () => {
  cy.findByTestId("wallet-button").click();
  cy.contains("Disconnect").click();
  cy.findByTestId("connect-button").should("be.visible");
  cy.disconnectMetamaskWalletFromDapp();
});

Cypress.Commands.add(
  "setupBridgeForm",
  (
    isMetamaskConnected: boolean,
    sourceNetwork: Network,
    tokenPair: Erc20Token,
    amount?: string,
    destinationAddress?: string
  ) => {
    cy.getTokenPairs(tokenPair).then((pair) => {
      let evmAddress = "";
      const erc20ToDfc = sourceNetwork === Network.Ethereum;
      const sourceToken = erc20ToDfc ? pair.tokenA : pair.tokenB;
      cy.findByTestId("source-network-dropdown-btn").click();
      cy.findByTestId(
        `source-network-dropdown-option-${sourceNetwork}`
      ).click();
      cy.findByTestId("token-pair-dropdown-btn").click();
      cy.findByTestId(`token-pair-${sourceToken}`).click();

      const destinationNetwork = erc20ToDfc
        ? Network.DeFiChain
        : Network.Ethereum;
      cy.validateFormPairing(
        isMetamaskConnected,
        sourceNetwork,
        destinationNetwork,
        tokenPair
      );

      if (amount !== undefined) {
        cy.findByTestId("quick-input-card-set-amount").type(amount);
      }

      if (erc20ToDfc && destinationAddress !== undefined) {
        cy.findByTestId("receiver-address-input").type(destinationAddress);
      } else {
        cy.findByTestId("receiver-address-use-metamask-btn")
          .click()
          .then(($element) => {
            evmAddress = $element.text();
          });
      }

      return cy.wrap({ evmAddress });
    });
  }
);

Cypress.Commands.add(
  "verifyExternalLinks",
  (extLink: { testId: string; url: string }) => {
    cy.findByTestId(extLink.testId)
      .should("be.visible")
      .should("have.attr", "href")
      .and("contain", extLink.url);
  }
);

Cypress.Commands.add("validateDropdownTokenSelection", (erc20ToDfc = true) => {
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
});

Cypress.Commands.add(
  "validateTokenPair",
  (tokenToSend: string, tokenToReceive: string) => {
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
);

Cypress.Commands.add(
  "validateNetwork",
  (networkType: "Source" | "Destination", networkName: Network) => {
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
);

Cypress.Commands.add(
  "validateFormPairing",
  (
    isMetamaskConnected: boolean,
    source: Network,
    destination: Network,
    tokenPair: Erc20Token
  ) => {
    cy.getTokenPairs(tokenPair).then((pair) => {
      const erc20ToDfc =
        source === Network.Ethereum && destination === Network.DeFiChain; // double typed check
      const { tokenA, tokenB } = pair;

      const tokenToSend = erc20ToDfc ? tokenA : tokenB;
      const tokeToReceive = erc20ToDfc ? tokenB : tokenA;

      // source network validation
      cy.validateNetwork("Source", source);
      cy.validateTokenPair(tokenToSend, tokeToReceive);

      // verify token pair dropdown
      cy.findByTestId("token-pair-dropdown-btn")
        .click()
        .should("have.attr", "aria-expanded", "true");
      cy.findByTestId("token-pair-dropdown-options")
        .should("be.visible")
        .should("contain.text", "Select token");
      cy.validateDropdownTokenSelection(erc20ToDfc);

      // verify network env visibility
      cy.findByTestId("network-env-switch").should(
        erc20ToDfc ? "exist" : "not.exist"
      );

      if (erc20ToDfc) {
        cy.findByTestId("network-env-switch").contains("Local"); // TODO: dynamic network env
      }

      // destination network validation
      cy.validateNetwork("Destination", destination);
      cy.validateTokenPair(tokenToSend, tokeToReceive);

      // receiver address
      cy.findByTestId("receiver-address").should("be.visible");
      cy.findByTestId("receiver-address-input")
        .should(isMetamaskConnected ? "be.enabled" : "be.disabled")
        .invoke("attr", "placeholder")
        .then((actualPlaceholder) => {
          expect(actualPlaceholder).to.equal(`Enter ${destination} address`);
        });

      // transfer button
      if (isMetamaskConnected) {
        cy.findByTestId("transfer-btn")
          .should("contain.text", "Review transaction")
          .should("be.disabled");
      } else {
        cy.findByTestId("transfer-btn")
          .should("contain.text", "Connect wallet")
          .should("be.enabled");
      }
    });
  }
);

Cypress.Commands.add("hardhatRequest", (method: string, params: any[]) => {
  cy.request({
    url: "http://localhost:8545",
    method: "POST",
    body: {
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 100000000000000),
      method,
      params,
    },
  });
});

Cypress.Commands.add("getTokenPairs", (token: Erc20Token) => {
  for (let pair of TokensPair) {
    if (pair.tokenA === token) {
      return cy.wrap(pair);
    }
  }

  // purposely fail test if no pairs are found
  cy.contains("Unable to find pair, test failed");
  return cy.wrap(TokensPair[0]);
});

Cypress.Commands.add(
  "validateUtilityModal",
  (
    title: string,
    message: string,
    primaryButtonLabel: string,
    secondaryButtonLabel: string
  ) => {
    cy.findByTestId("utility-title").should("contain.text", title);
    cy.findByTestId("utility-msg").should("contain.text", message);
    cy.findByTestId("utility-primary-btn").should(
      "contain.text",
      primaryButtonLabel
    );
    cy.findByTestId("utility-secondary-btn").should(
      "contain.text",
      secondaryButtonLabel
    );
  }
);

Cypress.Commands.add(
  "validateLockedForm",
  (
    sourceNetwork: Network,
    destinationNetwork: Network,
    tokenPair: Erc20Token,
    amount: string,
    destinationAddress: string
  ) => {
    cy.getTokenPairs(tokenPair).then((pair) => {
      // validate source data still persisted
      cy.findByTestId("source-network-dropdown-btn").should(
        "contain.text",
        sourceNetwork
      );
      cy.findByTestId("token-pair-dropdown-btn").should(
        "contain.text",
        pair.tokenA
      );
      cy.findByTestId("quick-input-card-set-amount").should(
        "have.attr",
        "value",
        amount
      );

      // validate destination data still persisted
      cy.findByTestId("destination-network-dropdown-btn").should(
        "contain.text",
        destinationNetwork
      );
      cy.findByTestId("token-to-receive-dropdown-btn").should(
        "contain.text",
        pair.tokenB
      );
      cy.findByTestId("wallet-address-input-verified-badge").should(
        "contain.text",
        destinationAddress
      );
    });

    // source fields
    cy.findByTestId("source-network-dropdown-btn").click();
    cy.findByTestId("source-network-dropdown-options").should("not.exist");
    cy.findByTestId("source-network-dropdown-icon").should("not.exist");
    cy.findByTestId("token-pair-dropdown-btn").click();
    cy.findByTestId("token-pair-dropdown-options").should("not.exist");
    cy.findByTestId("token-pair-dropdown-icon").should("not.exist");
    cy.findByTestId("quick-input-card-set-amount").should("be.disabled");
    cy.findByTestId("quick-input-card-set-amount-25%").should("be.disabled");
    cy.findByTestId("quick-input-card-set-amount-50%").should("be.disabled");
    cy.findByTestId("quick-input-card-set-amount-75%").should("be.disabled");
    cy.findByTestId("quick-input-card-set-amount-Max").should("be.disabled");
    cy.findByTestId("quick-input-card-lock-icon").should("be.visible");

    // swap button
    cy.findByTestId("transfer-flow-swap-btn").should("be.disabled");
    cy.findByTestId("swap-btn-arrow-down").should("be.visible");
    cy.findByTestId("swap-btn-switch").should("be.hidden");

    // destination fields
    cy.findByTestId("receiver-address-paste-icon-tooltip")
      .realHover()
      .then(() => {
        cy.findByTestId("receiver-address-paste-icon-tooltip-content").should(
          "not.exist"
        );
      });
    cy.findByTestId("receiver-address-input").should("be.hidden");
    cy.findByTestId("receiver-address-lock-icon").should("be.visible");

    // action buttons
    cy.findByTestId("transfer-btn").should("contain.text", "Retry transfer");
    cy.findByTestId("reset-btn")
      .should("be.visible")
      .should("contain.text", "Reset form");
  }
);

Cypress.Commands.add("sendTokenToWallet", (tempAddress, amount, token) => {
  console.log("Senddding token", tempAddress);
  cy.request({
    url: "https://playground.jellyfishsdk.com/v0/playground/rpc/sendtokenstoaddress",
    method: "POST",
    body: {
      params: [{}, { [tempAddress]: `${amount}@${token}` }],
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
