import truncateTextFromMiddle from "../../src/utils/textHelper";
import { DOCUMENTATION_URL } from "../../src/constants";

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

describe("QA-769-1 Connect wallet - Connect wallet", () => {
  it("QA-769-1-1 should show connect wallet popup", () => {
    // display from top connect button
    cy.findByTestId("connect-button").should("be.visible").click();
    cy.contains("MetaMask").should("exist");

    // work around to dismiss the popup
    cy.reload();

    // display from bottom transfer button
    cy.findByTestId("transfer-btn")
      .should("contain.text", "Connect wallet")
      .click();
    cy.contains("MetaMask").click();
    cy.acceptMetamaskAccess().should("be.true");
    cy.findByTestId("wallet-button").should("be.visible");
  });
});

describe("QA-769-1 Connect wallet - Connect Wallet (auto connected)", () => {
  let connectedWalletAddress: string;

  beforeEach(() => {
    cy.connectMetaMaskWallet();
    cy.getMetamaskWalletAddress().then((address) => {
      if (address !== undefined) {
        connectedWalletAddress = address as string;
      }
    });
  });

  it("QA-769-1-2 should verify wallet connected button state", () => {
    cy.findByTestId("wallet-button").should("be.visible");
    cy.findByTestId("connected_wallet_add").should(
      "contain.text",
      truncateTextFromMiddle(connectedWalletAddress, 5)
    );
    cy.findByTestId("connected_env").should("contain.text", "Localhost");
    cy.findByTestId("transfer-btn")
      .should("not.be.enabled")
      .should("contain.text", "Review transaction");
  });

  it("QA-769-1-4 should verify form destination", () => {
    cy.findByTestId("source-network-dropdown-btn").click();
    cy.findByTestId("source-network-dropdown-option-Ethereum").click();
    cy.findByTestId("source-network-input").should("contain.text", "Ethereum");
    cy.findByTestId("network-env-switch").should("contain.text", "Local");
    cy.findByTestId("receiver-address-input")
      .invoke("attr", "placeholder")
      .then((placeholder) => {
        expect(placeholder).to.equal("Enter DeFiChain address");
      });
    cy.findByTestId("address_error_message").should(
      "contain.text",
      "Make sure to only use Local for testing"
    );
  });
});

describe.only("QA-769-2 Connected wallet - guides", () => {
  it("QA-769-2-1 should redirect to documents and faqs", () => {
    cy.findByTestId("documentation-link")
      // .invoke("removeAttr", "target")
      .click();
    cy.wait(5000);
    cy.url().then((url) => {
      expect(url).to.equal(DOCUMENTATION_URL);
    });
    // cy.url().should("contain.text", DOCUMENTATION_URL);

    // cy.go("back");
    // cy.findByTestId("faqs-link").click();
    // cy.url().should("contain.text", FAQS_URL);
  });

  it("QA-769-2-2 should redirect to home on logo clicked", () => {
    cy.findByTestId("header-bridge-logo").click();
    cy.findByTestId("homepage").should("exist");
  });
});

describe("QA-769-3 Connected wallet - hover", () => {
  let connectedWalletAddress: string;

  beforeEach(() => {
    cy.connectMetaMaskWallet();
    cy.getMetamaskWalletAddress().then((address) => {
      if (address !== undefined) {
        connectedWalletAddress = address as string;
      }
    });
  });

  it("QA-769-3-1 should verify switch source button", () => {
    // select source network Ethereum and token USDT
    cy.findByTestId("source-network-dropdown-btn").click();
    cy.findByTestId("source-network-dropdown-option-Ethereum").click();
    cy.findByTestId("tokenA-dropdown-btn").click();
    cy.findByTestId("tokenA-dropdown-option-USDT").click();

    // verify source network Ethereum and token USDT
    cy.findByTestId("source-network-input").should("contain.text", "Ethereum");
    cy.findByTestId("tokenA-input").should("contain.text", "USDT");

    // verify destination network Defichain and token dUSDT
    cy.findByTestId("destination-network-input").should(
      "contain.text",
      "DeFiChain"
    );
    cy.findByTestId("tokenB-input").should("contain.text", "dUSDT");

    // verify switch source
    cy.findByTestId("transfer-flow-icon").should("be.visible");
    cy.findByTestId("switch-source-icon").should("be.hidden");
    cy.findByTestId("transfer-flow-swap-btn").trigger("mouseover");
    cy.findByTestId("transfer-flow-icon").should("be.hidden");
    cy.findByTestId("switch-source-icon").should("be.visible");
    cy.findByTestId("transfer-flow-swap-tooltip")
      .should("be.visible")
      .should("contain.text", "Switch source")
      .click();

    // verify source network Defichain and token dUSDT
    cy.findByTestId("source-network-input").should("contain.text", "DeFiChain");
    cy.findByTestId("tokenA-input").should("contain.text", "dUSDT");

    // verify destination network Ethereum and token dUSDT
    cy.findByTestId("destination-network-input").should(
      "contain.text",
      "Ethereum"
    );
    cy.findByTestId("tokenB-input").should("contain.text", "USDT");
  });

  it("QA-769-3-2 should verify source percentage hover", () => {
    // 25%
    cy.findByTestId("quick-input-card-set-amount-25%")
      .trigger("mouseover")
      .should("have.css", "color", "rgb(217, 123, 1)");
  });

  it("QA-769-3-3 should verify paste icon hover", () => {});

  it("QA-769-3-3 should verify fees hover", () => {});
});
