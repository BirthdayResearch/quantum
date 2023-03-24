import BigNumber from "bignumber.js";

const testNetUrl = "http://localhost:3001/liquidity?network=TestNet";

const desktopViewPorts = ["macbook-15", "ipad-2"];

desktopViewPorts.forEach((viewPort) => {
  context(`Liquidity page on ${viewPort}`, () => {
    const testNetBalancesUrl = "https://testnet.api.quantumbridge.app/balances";
    const mainNetBalancesUrl = "https://api.quantumbridge.app/balances";

    const dfcAddress = "tf1qsckyp02vdzaf95cjl5dr95n8stcalze0pfswcp";
    const evmAddress = "0x96E5E1d6377ffA08B9c08B066f430e33e3c4C9ef";

    beforeEach(() => {
      cy.visit(testNetUrl);
      cy.viewport(<Cypress.ViewportPreset>viewPort);
    });

    it("should check Proof of Baking link", () => {
      cy.get(".mt-1 > a")
        .should("have.attr", "href")
        .and("include", "https://defiscan.live/proof-of-backing");
    });

    it("should check that Addresses links are correct", () => {
      cy.findAllByText(dfcAddress)
        .should("have.length", 6)
        .and("have.attr", "href")
        .and("include", "https://defiscan.live/address/" + dfcAddress);
      cy.findAllByText(evmAddress)
        .should("have.length", 6)
        .and("have.attr", "href")
        .and("include", "https://goerli.etherscan.io/address/" + evmAddress);
    });

    it("should check that liquidity values displayed correctly", () => {
      cy.request(testNetBalancesUrl).then((response) => {
        cy.getLiquidityValueByIndex(0).should(
          "include",
          BigNumber(response.body.DFC.DFI).toFixed(8)
        );
        cy.getLiquidityValueByIndex(1).should(
          "include",
          BigNumber(response.body.EVM.DFI).toFixed(8)
        );
        cy.getLiquidityValueByIndex(2).should(
          "include",
          BigNumber(response.body.DFC.BTC).toFixed(8)
        );
        cy.getLiquidityValueByIndex(3).should(
          "include",
          BigNumber(response.body.EVM.WBTC).toFixed(8)
        );
        cy.getLiquidityValueByIndex(4).should(
          "include",
          BigNumber(response.body.DFC.ETH).toFixed(8)
        );
        cy.getLiquidityValueByIndex(5).should(
          "include",
          BigNumber(response.body.EVM.ETH).toFixed(8)
        );
        cy.getLiquidityValueByIndex(6).should(
          "include",
          BigNumber(response.body.DFC.USDT).toFixed(8)
        );
        cy.getLiquidityValueByIndex(7).should(
          "include",
          BigNumber(response.body.EVM.USDT).toFixed(8)
        );
        cy.getLiquidityValueByIndex(8).should(
          "include",
          BigNumber(response.body.DFC.USDC).toFixed(8)
        );
        cy.getLiquidityValueByIndex(9).should(
          "include",
          BigNumber(response.body.EVM.USDC).toFixed(8)
        );
        cy.getLiquidityValueByIndex(10).should(
          "include",
          BigNumber(response.body.DFC.EUROC).toFixed(8)
        );
        cy.getLiquidityValueByIndex(11).should(
          "include",
          BigNumber(response.body.EVM.EUROC).toFixed(8)
        );
      });
    });
  });
});

const mobileViewPort = "iphone-x";

context(`Liquidity page on ${mobileViewPort}`, () => {
  beforeEach(() => {
    cy.visit(testNetUrl);
    cy.viewport(<Cypress.ViewportPreset>mobileViewPort);
  });

  it("should check navigation between Bridge and Liquidity pages", () => {
    cy.get(".flex-col  .px-5 > div.p-1 > a")
      .first()
      .should("be.visible")
      .click();
    cy.url().should("not.contain", "liquidity");
    cy.get(".flex-col  .px-5 > div.p-1 > a")
      .last()
      .should("be.visible")
      .click();
  });

  it("should check responsive design for the Liquidity table elements", () => {
    cy.get(".space-y-3 > .border-gradient-6 svg[stroke='currentColor']").should(
      "have.length",
      6
    );
    cy.viewport(<Cypress.ViewportPreset>desktopViewPorts[0]);
    cy.get(".space-y-3 > .border-gradient-6 svg[stroke='currentColor']").should(
      "have.length",
      24
    );
  });
});
