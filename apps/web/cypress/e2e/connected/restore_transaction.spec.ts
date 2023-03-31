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
  cy.connectMetaMaskWallet();
});

function validateInitialState() {
  // verify restore modal
  cy.findByTestId("restore-txn-modal").should("be.visible");
  cy.findByTestId("restore-txn-title").should(
    "contain.text",
    "Recover transaction"
  );
  cy.findByTestId("restore-txn-msg").should(
    "contain.text",
    "Enter your Ethereum transaction ID to load your transaction again for review"
  );
  cy.findByTestId("restore-txn-input-label").should(
    "contain.text",
    "Transaction ID"
  );
  cy.findByTestId("restore-txn-tooltip").realHover();
  cy.findByTestId("restore-txn-input-container").should(
    "have.class",
    "border-dark-300"
  );
  cy.findByTestId("restore-txn-tooltip-content")
    .should("be.visible")
    .should("contain.text", "Paste from clipboard");
  cy.findByTestId("restore-txn-input")
    .invoke("attr", "placeholder")
    .then((placeholder) => {
      expect(placeholder).to.equal("Enter Transaction ID");
    });
  cy.findByTestId("restore-txn-input-error-msg").should("not.exist");
  cy.findByTestId("restore-txn-btn")
    .should("be.disabled")
    .should("contain.text", "Restore transaction");
}

context("QA-769-5 Connected wallet - Restore Lost Session", () => {
  it("1: Verify restore button visibility", () => {
    // shown default
    cy.findByTestId("transaction-interrupted-msg")
      .should("be.visible")
      .should("contain.text", "Transaction interrupted?");

    // hidden when amount is input
    cy.findByTestId("quick-input-card-set-amount").type("0.001");
    cy.findByTestId("transaction-interrupted-msg").should("not.exist");
    cy.findByTestId("quick-input-card-set-amount").clear();
    cy.findByTestId("transaction-interrupted-msg").should("be.visible");

    // hidden when is DFC > EVM
    cy.findByTestId("transfer-flow-swap-btn").click();
    cy.findByTestId("transaction-interrupted-msg").should("not.exist");
    cy.findByTestId("transfer-flow-swap-btn").click();
    cy.findByTestId("transaction-interrupted-msg").should("be.visible");
  });

  it("2: Verify restore modal", () => {
    cy.findByTestId("restore-btn").click();
    validateInitialState();

    // verify input error
    cy.findByTestId("restore-txn-input").type("qwerty123$%");
    cy.findByTestId("restore-txn-btn").should("be.enabled").click();
    cy.findByTestId("restore-txn-input-error-msg")
      .should("be.visible")
      .should(
        "contain.text",
        "Enter a valid Ethereum txid performed on Quantum"
      );
    cy.findByTestId("restore-txn-input-container").should(
      "have.class",
      "border-error"
    );

    // verify input cleared
    cy.findByTestId("restore-txn-clear-icon").click();
    cy.findByTestId("restore-txn-input").should("contain.text", "");
    cy.findByTestId("restore-txn-input-error-msg").should("not.exist");
    cy.findByTestId("restore-txn-input-container").should(
      "have.class",
      "border-transparent"
    );
    cy.findByTestId("restore-txn-btn").should("be.disabled");

    // close modal
    cy.findByTestId("restore-txn-modal-close-icon").click();
    cy.findByTestId("restore-txn-modal").should("not.exist");
    cy.findByTestId("bridge-form").should("be.visible");
  });
});
