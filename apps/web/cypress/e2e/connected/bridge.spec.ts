import truncateTextFromMiddle from "../../../src/utils/textHelper";
import { Network } from "../../../src/types";

beforeEach(() => {
  cy.visitBridgeHomePage();
});

context("QA-769-1 Connected wallet - Connect wallet", () => {
  it("QA-769-1-1 should show connect wallet popup", () => {
    cy.verifyConnectWalletPopUp();
  });

  it("QA-769-1-2~3 should verify wallet connected button state", () => {
    cy.connectMetaMaskWallet();
    cy.findByTestId("wallet-button").should("be.visible");
    cy.getMetamaskWalletAddress().then((address) => {
      if (address !== undefined) {
        cy.findByTestId("connected_wallet_add").should(
          "contain.text",
          truncateTextFromMiddle(address as string, 5)
        );
      }
    });

    cy.findByTestId("connected_env").should("contain.text", "Localhost");

    // verify pairing
    cy.verifyFormPairing(true, Network.Ethereum, Network.DeFiChain, "DFI");
  });
});

context("QA-769-3 Connected wallet - Hover", () => {
  it("QA-769-3: Verify form icons hovers", () => {
    cy.connectMetaMaskWallet();
    cy.verifyFormHover(true);
  });
});

context("QA-769-7~12 Connected wallet - Bridge Form", () => {
  const source = Network.Ethereum;
  const destination = Network.DeFiChain;
  const currentPair = "DFI";

  beforeEach(() => {
    cy.connectMetaMaskWallet();
  });

  it("1: Verify the Bridge form is visible", () => {
    cy.findByTestId("bridge-form").should("be.visible");
  });

  it("2: Verify form initial state", () => {
    // verify pairing
    cy.verifyFormPairing(true, source, destination, currentPair);

    cy.findByTestId("transaction-interrupted-msg").should("be.visible");
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
    cy.verifyFormPairing(true, destination, source, currentPair);
  });

  it("5: Verify HW balance", () => {
    cy.verifyHotWalletBalance();
  });

  it("6: Verify input error state", () => {
    // amount input error
    cy.findByTestId("quick-input-card-set-amount").type("9999999999");
    cy.findByTestId("amount-err")
      .should("be.visible")
      .should("contain.text", "Insufficient Funds");
    cy.findByTestId("quick-input-card").should("have.class", "border-error");
    cy.findByTestId("quick-input-card-clear-icon").click();
    cy.findByTestId("amount-err").should("not.exist");
    cy.findByTestId("quick-input-card-clear-icon").should("not.exist");

    // DFC destination address error
    cy.findByTestId("receiver-address-input").type("123456789");
    cy.findByTestId("receiver-address-error-msg")
      .should("be.visible")
      .should("contain.text", "Use correct address for DeFiChain Local");
    cy.findByTestId("receiver-address").should("have.class", "border-error");

    // switch source
    cy.findByTestId("transfer-flow-swap-btn").should("be.visible").click();

    // EVM destination address error
    cy.findByTestId("receiver-address-error-msg")
      .should("be.visible")
      .should("contain.text", "Use correct address for Ethereum");
    cy.findByTestId("receiver-address").should("have.class", "border-error");
    cy.findByTestId("receiver-address-clear").click();
    cy.findByTestId("receiver-address-error-msg").should("contain.text", "");
    cy.findByTestId("receiver-address-clear").should("not.exist");
  });
});

context("QA-799-1 Disconnect wallet", () => {
  it("1: Verify disconnect", () => {
    cy.connectMetaMaskWallet();
    cy.findByTestId("wallet-button").should("be.visible");
    cy.disconnectMetaMaskWallet();
    cy.verifyFormPairing(false, Network.Ethereum, Network.DeFiChain, "DFI");
  });
});
