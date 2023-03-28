// // TODO: Mock wallet data

// beforeEach(() => {
//   cy.visit("http://localhost:3000/?network=Local", {
//     onBeforeLoad: (win) => {
//       let nextData: any;
//       Object.defineProperty(win, "__NEXT_DATA__", {
//         set(o) {
//           console.log("setting __NEXT_DATA__", o.props.pageProps);
//           // here is our change to modify the injected parsed data
//           o.props.pageProps.isBridgeUp = true;
//           nextData = o;
//         },
//         get() {
//           return nextData;
//         },
//       });
//     },
//   });
// });

// context("QA-770 DeFiChain to Ethereum Virtual Machine transaction", () => {
//   it("1: Verify Ethereum and DeFiChain options", () => {
//     const source = "Ethereum";
//     const destination = "DeFiChain";

//     // verify pairing
//     validateFormPairing(source, destination);

//     // verifiying Network source option
//     cy.findByTestId("source-network-dropdown-btn").should("be.visible").click();
//     cy.findByTestId("source-network-dropdown-options")
//       .should("be.visible")
//       .should("contain.text", "Select source");

//     cy.findByTestId("source-network-dropdown-option-Ethereum")
//       .should("be.visible")
//       .should("have.attr", "aria-selected", "true");
//     cy.findByTestId(
//       "source-network-dropdown-option-Ethereum-checked-marker"
//     ).should("be.visible");

//     cy.findByTestId(`source-network-dropdown-option-DeFiChain"`)
//       .should("be.visible")
//       .should("have.attr", "aria-selected", "false");
//     cy.findByTestId(
//       "source-network-dropdown-option-Ethereum-checked-marker"
//     ).should("not.be.visible");

//     // verifiying token source option
//     cy.findByTestId("tokenA-dropdown-btn").should("be.visible").click();
//     cy.findByTestId("tokenA-dropdown-options")
//       .should("be.visible")
//       .should("contain.text", "Select token");
//   });
// });
