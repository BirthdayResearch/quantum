// TODO: Mock wallet data

import { Erc20Token, Network } from "../../../src/types";

function interceptHotWalletBalance(
  destinationNetwork: Network,
  token: Erc20Token,
  amount: number
) {
  const isEthereumDestination = destinationNetwork === Network.Ethereum;
  const tokenSymbol = isEthereumDestination && token === "WBTC" ? "BTC" : token;
  const endpoint = isEthereumDestination ? "ethereum" : "defichain/wallet";
  cy.intercept(`**/${endpoint}/balance/${tokenSymbol}`, [amount]);
}

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

context("QA-755-5~16 Pre-connected wallet - Bridge Form", () => {
  const source = Network.Ethereum;
  const destination = Network.DeFiChain;
  const currentPair = "WBTC";

  it("1: Verify the Bridge form is visible", () => {
    cy.findByTestId("bridge-form").should("be.visible");
  });

  it("2: Verify form initial state", () => {
    // verify pairing
    cy.validateFormPairing(false, source, destination, currentPair);

    // action button
    cy.findByTestId("transfer-btn")
      .should("be.visible")
      .contains("Connect wallet");

    cy.findByTestId("transaction-interrupted-msg").should("not.exist");
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
    cy.validateFormPairing(false, destination, source, currentPair);
  });

  it("5: Verify HW balance", () => {
    // DFC HW - empty
    interceptHotWalletBalance(Network.DeFiChain, "DFI", 0);
    cy.findByTestId("transfer-btn").should("be.disabled");
    cy.findByTestId("error-insufficient-balance")
      .should("be.visible")
      .should(
        "contain.text",
        "Unable to process due to liquidity cap, please try again in a few hours"
      );

    // DFC HW - 10 balance
    cy.findByTestId("token-pair-dropdown-btn").click();
    cy.findByTestId(`token-pair-ETH`).click();
    interceptHotWalletBalance(Network.DeFiChain, "ETH", 10);
    cy.findByTestId("transfer-btn").should("be.enabled");
    cy.findByTestId("error-insufficient-balance").should("not.exist");

    // EVM HW - empty
    cy.findByTestId("transfer-flow-swap-btn").click();
    interceptHotWalletBalance(Network.Ethereum, "ETH", 0);
    cy.findByTestId("transfer-btn").should("be.disabled");
    cy.findByTestId("error-insufficient-balance")
      .should("be.visible")
      .should(
        "contain.text",
        "Unable to process due to liquidity cap, please try again in a few hours"
      );

    // EVM HW - 50 balance
    cy.findByTestId("token-pair-dropdown-btn").click();
    cy.findByTestId(`token-pair-dUSDT`).click();
    interceptHotWalletBalance(Network.Ethereum, "USDT", 50);
    cy.findByTestId("transfer-btn").should("be.enabled");
    cy.findByTestId("error-insufficient-balance").should("not.exist");
  });
});

context("QA-755-3 Pre-connected wallet - Hover", () => {
  it("QA-755-3-1: Switch source hovers", () => {
    // verify switch source before hover
    cy.findByTestId("swap-btn-arrow-down").should("be.visible");
    cy.findByTestId("swap-btn-switch").should("be.hidden");

    // hover switch source
    cy.findByTestId("transfer-flow-swap-btn").realHover();

    // verify switch source on hover
    cy.findByTestId("swap-btn-arrow-down").should("be.hidden");
    cy.findByTestId("swap-btn-switch").should("be.visible");
    cy.findByTestId("transfer-flow-swap-tooltip-content")
      .should("be.visible")
      .should("contain.text", "Switch source");
  });

  it("QA-755-3-2: Fees and paste icon hovers", () => {
    // hover fees
    cy.findByTestId("fees-tooltip-icon").realHover();
    cy.findByTestId("fees-tooltip-content")
      .should("be.visible")
      .should(
        "contain.text",
        "Fees to cover the cost of transactions on DeFiChain and Ethereum networks. For more information, visit our user guide."
      );

    // hover paste icon should not show anything
    cy.findByTestId("receiver-address-paste-icon-tooltip").realHover();
    cy.findByTestId("receiver-address-paste-icon-tooltip-content").should(
      "not.exist"
    );
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
