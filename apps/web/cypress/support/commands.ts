import "@testing-library/cypress/add-commands";
import BigNumber from "bignumber.js";
import { DToken, Erc20Token, Network } from "../../src/types";
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
       * @description Quick setup for bridge form
       * @param {Network} sourceNetwork to be bridge from, Ethereum or DeFiChain
       * @param {Erc20Token} DToken|Erc20Token to be bridge from,  Ethereum network > WBTC, USDT, USDC, ETH, EUROC, DFI, DeFiChain network dBTC, dUSDT, dUSDC, dETH, dEUROC, DFI
       * @param {string} amount to be sent
       * @param {string} toReceive amount to be received
       * @param {string} fee amount to be paid
       * @param {string} destinationAddress to be sent to
       * @example cy.setupBridgeForm()
       */
      setupBridgeForm: (
        sourceNetwork: Network,
        sourceToken: DToken | Erc20Token,
        destinationToken: DToken | Erc20Token,
        amount: string,
        fee: string,
        toReceive: string,
        destinationAddress?: string
      ) => Chainable<{ evmAddress: string }>;

      /**
       * @description Set feature flags
       * @param {string[]} flags to be set
       * @example cy.setFeatureFlags(['feature_a', 'feature_b'], 'beta')
       */
      setFeatureFlags: (flags: string[], stage?: string) => Chainable<Element>;

      /**
       * @description Sends token to wallet. Accepts a list of token symbols to be sent.
       * @param {string[]} tokens to be sent
       * @param {string} amount to be sent
       * @param {DToken|Erc20Token} token to be sent
       * @example cy.sendTokenToWallet(['BTC', 'ETH']).wait(4000)
       */
      sendTokenToWallet: (
        params: any,
        amount: string,
        token: DToken | Erc20Token
      ) => Chainable<Element>;

      verifyTokenLogo: (
        testId: string,
        token: DToken | Erc20Token
      ) => Chainable<Element>;
    }
  }
}

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
  "verifyExternalLinks",
  (extLink: { testId: string; url: string }) => {
    cy.findByTestId(extLink.testId)
      .should("be.visible")
      .should("have.attr", "href")
      .and("contain", extLink.url);
  }
);

Cypress.Commands.add(
  "setupBridgeForm",
  (
    sourceNetwork: Network,
    sourceToken: DToken | Erc20Token,
    destinationToken: DToken | Erc20Token,
    amount: string,
    fee: string,
    toReceive: string,
    destinationAddress?: string
  ) => {
    let evmAddress = "";
    const isEvmToDfc = sourceNetwork === Network.Ethereum;

    cy.findByTestId("source-network-dropdown-btn").click();
    cy.findByTestId(`source-network-dropdown-option-${sourceNetwork}`).click();
    cy.findByTestId("token-pair-dropdown-btn").click();
    cy.findByTestId(`token-pair-to-send-${sourceToken}`).click();

    cy.findByTestId("quick-input-card-set-amount").type(amount);

    cy.findByTestId("fees-amount")
      .should("exist")
      .contains(`${fee} ${sourceToken}`);
    cy.findByTestId("to-receive-amount")
      .should("exist")
      .contains(`${toReceive} ${destinationToken}`);

    if (isEvmToDfc && destinationAddress) {
      cy.findByTestId("receiver-address-input").type(destinationAddress);
    } else {
      cy.findByTestId("receiver-address-use-metamask-btn")
        .click()
        .then(($element) => {
          evmAddress = $element.text();
        });
    }

    return cy.wrap({ evmAddress });
  }
);

Cypress.Commands.add("verifyTokenLogo", (testId, token) => {
  cy.findByTestId(testId)
    .should("be.visible")
    .should("have.attr", "alt", "USDT")
    .should("have.attr", "src", "/tokens/USDT.svg");
});

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
