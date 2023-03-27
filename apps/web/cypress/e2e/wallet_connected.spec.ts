import truncateTextFromMiddle from "../../src/utils/textHelper";
import { DOCUMENTATION_URL, FAQS_URL, FEES_INFO } from "../../src/constants";

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

describe("QA-769-2 Connected wallet - guides", () => {
  it("QA-769-2-1 should redirect to documents and faqs", () => {
    // due to having different domain, we cannot use cy.url() or cy.location() to check.
    // checking "href" is the suggested alternative by cypress.
    cy.findByTestId("documentation-link").should(
      "have.attr",
      "href",
      DOCUMENTATION_URL
    );
    cy.findByTestId("faqs-link").should("have.attr", "href", FAQS_URL);
  });

  it("QA-769-2-2 should redirect to home on logo clicked", () => {
    cy.findByTestId("header-bridge-logo").click();
    cy.findByTestId("homepage").should("exist");
  });
});

describe.only("QA-769-3 Connected wallet - hover", () => {
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

    // verify switch source before hover
    cy.findByTestId("transfer-flow-icon").should("be.visible");
    cy.findByTestId("switch-source-icon").should("not.be.visible");

    // hover
    cy.findByTestId("transfer-flow-swap-btn").realHover();

    // verify switch source on hover
    cy.findByTestId("transfer-flow-icon").should("not.be.visible");
    cy.findByTestId("switch-source-icon").should("be.visible");
    cy.findByTestId("transfer-flow-swap-tooltip-text")
      .should("be.visible")
      .should("contain.text", "Switch source");

    // switch source and destination
    cy.findByTestId("transfer-flow-swap-btn").click();

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
    const amountArray = ["25%", "50%", "75%", "Max"];
    amountArray.forEach((amountType) => {
      const viewId = `quick-input-card-set-amount-${amountType}`;
      cy.findByTestId(viewId).realHover();
      cy.findByTestId(viewId)
        .should("have.css", "background-image")
        .and(
          "contain",
          "linear-gradient(90deg, rgb(255, 0, 255) 0%, rgb(236, 12, 141) 100.04%)"
        );
    });
  });

  it.only("QA-769-3-3 should verify paste icon hover", () => {
    cy.findByTestId("receiver-address-tooltip-button").realHover();
    cy.wait(3000);
    cy.findByTestId("receiver-address-tooltip-text").should(
      "contain.text",
      "Paste from clipboard"
    );

    cy.window().then((win) => {
      win.navigator.clipboard.writeText("address");
    });

    // await navigator.clipboard.writeText("address");
    cy.findByTestId("paste-btn").click();
    // cy.findByTestId("receiver-address-tooltip-button").click();
    cy.findByTestId("receiver-address-input").should("contain.text", "address");
    cy.findByTestId("added-clipboard-toast").should(
      "contain.text",
      "Added from clipboard"
    );
  });

  it("QA-769-3-4 should verify fees hover", () => {
    cy.findByTestId("fees-icon-tooltip").realHover();
    cy.findByTestId("fees-icon-tooltip-text").should(
      "contain.text",
      FEES_INFO.content
    );
  });
});

describe("QA-769-5 Connected wallet - ETH > DFC - Restore Lost Session", () => {
  beforeEach(() => {
    cy.connectMetaMaskWallet();
  });

  it("QA-769-5-1 should verify recover transaction invalid input", () => {});
});
