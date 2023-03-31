import "@testing-library/cypress/add-commands";
import { Erc20Token, Network, UtilityButtonType } from "../../src/types";
import { DISCLAIMER_MESSAGE } from "../../src/constants";
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
       * hardhatRequest("evm_setAutomine", [true]);
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
       * @param {UtilityDataI} data - verify title, message, primary button label, secondary button label, and which button to click
       * @example
       * validateUtilityModal({"Error", "Something went wrong", "Try again", "Close", UtilityButtonType.PRIMARY});
       */
      validateUtilityModal: (data: UtilityDataI) => Chainable<Element>;

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

      /**
       * @description Verify the locked form and reset form functionality in a bridge form. It checks the utility modal content,
       * primary and secondary button functionality, as well as form reset validation.
       * @param {Network} sourceNetwork to be bridge from
       * @param {Network} destinationNetwork to bridge to
       * @param {Erc20Token} tokenPair to be sent and receive from bridge
       * @param {string} amount to be sent
       * @param {string} destinationAddress to receive the token amount
       * @example
       * cy.verifyLockedAndResetForm(Network.Ethereum, Network.DeFiChain, "WBTC", "0.001", "xxxxxxx");
       */
      verifyLockedAndResetForm: (
        sourceNetwork: Network,
        destinationNetwork: Network,
        tokenPair: Erc20Token,
        amount: string,
        destinationAddress: string
      ) => Chainable<Element>;

      /**
       * @description Verify the metamask connection
       * @example cy.verifyMetamaskConnection();
       */
      verifyConnectWalletPopUp: () => Chainable<Element>;

      /**
       * @description Validate the content and structure of the confirm transfer modal in a bridge form. It checks the
       * source and destination addresses, network names, amounts, token icons, and other relevant details.
       * @param {Network} sourceNetwork - The source network for the transaction
       * @param {Erc20Token} tokenPair - The ERC20 token pair for the transaction
       * @param {string} amount - The amount to be transferred
       * @param {string} expectedToReceive - The expected amount to be received
       * @param {string} expectedFee - The expected fee
       * @param {string} connectedWalletAddress - The connected wallet address, if available
       * @param {string} dfcAddress - The destination dfc address, only for evm to dfc flow
       * @example
       * cy.validateConfirmTransferModal(Network.Ethereum, Erc20Token.DAI, "10", "0x1234...5678");
       */
      validateConfirmTransferModal: (
        sourceNetwork: Network,
        tokenPair: Erc20Token,
        amount: string,
        expectedToReceive: string,
        expectedFee: string,
        connectedWalletAddress?: string,
        dfcAddress?: string
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

export interface UtilityDataI {
  title?: string;
  message?: string;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  clickButton?: UtilityButtonType;
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
    cy.findByTestId(`token-pair-to-send-${tokenA}`).should("exist");
    cy.findByTestId(`token-pair-to-receive-${tokenB}`).should("exist");
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

      // amount input
      cy.findByTestId("quick-input-card-set-btn").should(
        erc20ToDfc ? "be.visible" : "not.exist"
      );

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
        cy.findByTestId("transfer-btn").should(
          "contain.text",
          "Connect wallet"
        );
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

Cypress.Commands.add("validateUtilityModal", (data: UtilityDataI) => {
  if (data.title !== undefined) {
    cy.findByTestId("utility-title").should("contain.text", data.title);
  }
  if (data.message !== undefined) {
    cy.findByTestId("utility-msg").should("contain.text", data.message);
  }
  if (data.primaryButtonLabel !== undefined) {
    cy.findByTestId("utility-modal-primary-btn").should(
      "contain.text",
      data.primaryButtonLabel
    );
  }
  if (data.secondaryButtonLabel !== undefined) {
    cy.findByTestId("utility-modal-secondary-btn").should(
      "contain.text",
      data.secondaryButtonLabel
    );
  }
  if (data.clickButton !== undefined) {
    cy.findByTestId(`utility-modal-${data.clickButton}-btn`).click();
  }
});

Cypress.Commands.add(
  "validateLockedForm",
  (
    sourceNetwork: Network,
    destinationNetwork: Network,
    tokenPair: Erc20Token,
    amount: string,
    destinationAddress: string
  ) => {
    const isEvmToDfc =
      sourceNetwork === Network.Ethereum &&
      destinationNetwork === Network.DeFiChain;
    cy.findByTestId("bridge-form").should("be.visible");
    cy.getTokenPairs(tokenPair).then((pair) => {
      let sourceToken: string;
      let destinationToken: string;
      if (isEvmToDfc) {
        sourceToken = pair.tokenA;
        destinationToken = pair.tokenB;
      } else {
        sourceToken = pair.tokenB;
        destinationToken = pair.tokenA;
      }

      // validate source data still persisted
      cy.findByTestId("source-network-dropdown-btn").should(
        "contain.text",
        sourceNetwork
      );
      cy.findByTestId("token-pair-dropdown-btn").should(
        "contain.text",
        sourceToken
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
        destinationToken
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
    if (isEvmToDfc) {
      cy.findByTestId("quick-input-card-set-amount-25%").should("be.disabled");
      cy.findByTestId("quick-input-card-set-amount-50%").should("be.disabled");
      cy.findByTestId("quick-input-card-set-amount-75%").should("be.disabled");
      cy.findByTestId("quick-input-card-set-amount-Max").should("be.disabled");
    } else {
      cy.findByTestId("quick-input-card-set-btn").should("not.exist");
    }
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
  cy.request({
    url: "https://playground.jellyfishsdk.com/v0/playground/rpc/sendtokenstoaddress",
    method: "POST",
    body: {
      params: [{}, { [tempAddress]: `${amount}@${token}` }],
    },
  });
});

Cypress.Commands.add("verifyConnectWalletPopUp", () => {
  // display from top connect button
  cy.findByTestId("connect-button").should("be.visible").click();
  cy.contains("MetaMask").should("exist");

  // work around to dismiss the popup
  cy.reload();

  // display from bottom transfer button
  cy.findByTestId("transfer-btn")
    .should("contain.text", "Connect wallet")
    .click();
  cy.contains("MetaMask").should("exist");
});

Cypress.Commands.add(
  "verifyLockedAndResetForm",
  (
    sourceNetwork: Network,
    destinationNetwork: Network,
    tokenPair: Erc20Token,
    amount: string,
    destinationAddress: string
  ) => {
    // Open the review transaction modal and verify its visibility
    cy.findByTestId("transfer-btn").click();
    cy.findByTestId("transaction-review-modal").should("exist");

    // Close the review transaction modal and open the utility modal
    cy.findByTestId("transaction-review-modal-close-icon").click();
    cy.findByTestId("utility-modal").should("exist");

    // Verify the utility modal content
    cy.validateUtilityModal({
      title: "Are you sure you want to leave your transaction?",
      message:
        "You may lose any pending transaction and funds related to it. This is irrecoverable, proceed with caution",
    });

    // Verify the functionality of the "Go back" button
    cy.validateUtilityModal({
      secondaryButtonLabel: "Go back",
      clickButton: UtilityButtonType.SECONDARY,
    });
    cy.findByTestId("utility-modal").should("not.exist");
    cy.findByTestId("transaction-review-modal").should("exist");

    // Close the review transaction modal and open the utility modal
    cy.findByTestId("transaction-review-modal-close-icon").click();
    cy.findByTestId("utility-modal").should("exist");

    // Verify the functionality of the "Leave transaction" button
    cy.validateUtilityModal({
      primaryButtonLabel: "Leave transaction",
      clickButton: UtilityButtonType.PRIMARY,
    });
    cy.findByTestId("transaction-review-modal").should("not.exist");

    // Verify the bridge form locked
    cy.validateLockedForm(
      sourceNetwork,
      destinationNetwork,
      tokenPair,
      amount,
      destinationAddress
    );

    // Verify the functionality of the "Retry transfer" button
    cy.findByTestId("transfer-btn").click();
    cy.findByTestId("transaction-review-modal").should("exist");

    // Close the utility modal and open the review transaction modal
    cy.findByTestId("transaction-review-modal-close-icon").click();
    cy.findByTestId("utility-modal-primary-btn").click();

    // Verify the functionality of the "Reset form" button
    cy.findByTestId("reset-btn")
      .should("be.visible")
      .should("contain.text", "Reset form")
      .click();

    // Verify the reset form utility modal and click "Reset form" button
    cy.findByTestId("utility-modal").should("exist");
    cy.validateUtilityModal({
      title: "Are you sure you want to reset form?",
      message:
        "Resetting it will lose any pending transaction and funds related to it. This is irrecoverable, proceed with caution",
      primaryButtonLabel: "Reset form",
      secondaryButtonLabel: "Go back",
      clickButton: UtilityButtonType.PRIMARY,
    });

    // Verify that the form has been reset
    cy.validateFormPairing(true, Network.Ethereum, Network.DeFiChain, "DFI");
  }
);

Cypress.Commands.add(
  "validateConfirmTransferModal",
  (
    sourceNetwork: Network,
    tokenPair: Erc20Token,
    amount: string,
    expectedToReceive: string,
    expectedFee: string,
    metamaskAddress?: string,
    dfcAddress?: string
  ) => {
    const isEvmToDfc = sourceNetwork === Network.Ethereum;
    const destinationNetwork =
      sourceNetwork === Network.Ethereum ? Network.DeFiChain : Network.Ethereum;

    cy.getTokenPairs(tokenPair).then((pair) => {
      let sourceToken: string;
      let destinationToken: string;
      if (isEvmToDfc) {
        sourceToken = pair.tokenA;
        destinationToken = pair.tokenB;
      } else {
        sourceToken = pair.tokenB;
        destinationToken = pair.tokenA;
      }

      // check review transaction modal
      cy.findByTestId("transaction-review-modal-title").should(
        "contain.text",
        "Review transaction"
      );

      // From source
      if (isEvmToDfc) {
        if (metamaskAddress !== undefined) {
          cy.findByTestId("from-source-address").should(
            "contain.text",
            metamaskAddress
          );
        }
        cy.findByTestId("from-source-network-name").should(
          "contain.text",
          `Source (${sourceNetwork})`
        );
      } else {
        cy.findByTestId("from-source-address").should(
          "contain.text",
          `${sourceNetwork} address`
        );
        cy.findByTestId("from-source-network-name").should(
          "contain.text",
          "Source"
        );
      }

      cy.findByTestId("from-source-amount").should(
        "contain.text",
        `-${amount}`
      );
      cy.findByTestId("from-source-token-icon").should(
        "have.attr",
        "src",
        `/tokens/${sourceToken}.svg`
      );
      cy.findByTestId("from-source-token-name").should(
        "contain.text",
        sourceToken
      );

      // To destination
      if (isEvmToDfc) {
        if (dfcAddress !== undefined) {
          cy.findByTestId("to-destination-address").should(
            "contain.text",
            dfcAddress
          );
        }
      } else {
        if (metamaskAddress !== undefined) {
          cy.findByTestId("to-destination-address").should(
            "contain.text",
            metamaskAddress
          );
        }
      }

      cy.findByTestId("to-destination-network-name").should(
        "contain.text",
        `Destination (${destinationNetwork})`
      );

      cy.findByTestId("to-destination-amount").should(
        "contain.text",
        expectedToReceive
      );
      cy.findByTestId("to-destination-token-icon").should(
        "have.attr",
        "src",
        `/tokens/${destinationToken}.svg`
      );

      cy.findByTestId("to-destination-token-name").should(
        "contain.text",
        destinationToken
      );

      if (isEvmToDfc) {
        cy.findByTestId("disclaimer-msg-evm").should(
          "contain.text",
          DISCLAIMER_MESSAGE
        );
      } else {
        cy.findByTestId("disclaimer-msg-dfc").should(
          "contain.text",
          "Transactions on-chain are irreversible. Ensure your transaction details are correct and funds are sent in a single transaction, with a stable network connection."
        );
      }

      cy.findByTestId("transaction-fees-amount")
        .invoke("text")
        .then((text) => {
          const split = text.split(" ");
          const value = split[0];
          const suffix = split[1];
          expect(value).to.equal(expectedFee);
          expect(suffix).to.equal(sourceToken);
        });

      if (isEvmToDfc) {
        cy.findByTestId("confirm-transfer-btn").should(
          "contain.text",
          "Confirm transfer on wallet"
        );
      }
    });
  }
);

// Helper function to swap pairs
function swapTokenPositions(
  pairs: { tokenA: string; tokenB: string }[]
): { tokenA: string; tokenB: string }[] {
  return pairs.map((pair) => {
    const { tokenA, tokenB } = pair;
    return { tokenA: tokenB, tokenB: tokenA };
  });
}
