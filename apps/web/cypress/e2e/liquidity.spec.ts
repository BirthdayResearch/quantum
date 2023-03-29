import BigNumber from "bignumber.js";

const urls = ["/liquidity?network=TestNet", "/liquidity?network=MainNet"];

const desktopViewPort = "macbook-15";
const mobileViewPort = "iphone-x";

urls.forEach((url) => {
  context(`Liquidity page on ${desktopViewPort} at the ${url}`, () => {
    const dfcAddressTn = "tf1qsckyp02vdzaf95cjl5dr95n8stcalze0pfswcp";
    const dfcAddressMn = "df1qgq0rjw09hr6vr7sny2m55hkr5qgze5l9hcm0lg";
    const evmAddressTn = "0x96E5E1d6377ffA08B9c08B066f430e33e3c4C9ef";
    const evmAddressMn = "0x54346d39976629b65ba54eac1c9ef0af3be1921b";

    const testNetBalancesUrl = "https://testnet.api.quantumbridge.app/balances";
    const mainNetBalancesUrl = "https://api.quantumbridge.app/balances";

    beforeEach(() => {
      cy.visit(url);
      cy.viewport(desktopViewPort);
    });

    it("should check Proof of Backing link", () => {
      cy.findByTestId("Desktop.POB.Url")
        .should("have.attr", "href")
        .and("include", "https://defiscan.live/proof-of-backing"); //TODO: add check for the mainnet by default after fix
    });

    it("should check that Addresses links are correct", () => {
      if (url.includes("TestNet")) {
        cy.findAllByText(dfcAddressTn)
          .should("have.length", 6)
          .and("have.attr", "href")
          .and("include", "https://defiscan.live/address/" + dfcAddressTn);
        cy.findAllByText(evmAddressTn)
          .should("have.length", 6)
          .and("have.attr", "href")
          .and(
            "include",
            "https://goerli.etherscan.io/address/" + evmAddressTn
          );
      } else {
        cy.findAllByText(dfcAddressMn)
          .should("have.length", 6)
          .and("have.attr", "href")
          .and("include", "https://defiscan.live/address/" + dfcAddressMn);
        cy.findAllByText(evmAddressMn)
          .should("have.length", 6)
          .and("have.attr", "href")
          .and("include", "https://etherscan.io/address/" + evmAddressMn);
      }
    });

    it("should check that liquidity values displayed correctly", () => {
      if (url.includes("TestNet")) {
        cy.request(testNetBalancesUrl).then((response) => {
          cy.getLiquidityBySymbolChain("DFI", "DeFiChain").should(
            "include",
            BigNumber(response.body.DFC.DFI).toFixed(8)
          );
          cy.getLiquidityBySymbolChain("dBTC", "DeFiChain").should(
            "include",
            BigNumber(response.body.DFC.BTC).toFixed(8)
          );
          cy.getLiquidityBySymbolChain("dETH", "DeFiChain").should(
            "include",
            BigNumber(response.body.DFC.ETH).toFixed(8)
          );
          cy.getLiquidityBySymbolChain("dUSDT", "DeFiChain").should(
            "include",
            BigNumber(response.body.DFC.USDT).toFixed(8)
          );
          cy.getLiquidityBySymbolChain("dUSDC", "DeFiChain").should(
            "include",
            BigNumber(response.body.DFC.USDC).toFixed(8)
          );
          cy.getLiquidityBySymbolChain("dEUROC", "DeFiChain").should(
            "include",
            BigNumber(response.body.DFC.EUROC).toFixed(8)
          );
        });
      } else {
        cy.request(mainNetBalancesUrl).then((response) => {
          cy.getLiquidityBySymbolChain("DFI", "Ethereum").should(
            "include",
            BigNumber(response.body.EVM.DFI).toFixed(8)
          );
          cy.getLiquidityBySymbolChain("WBTC", "Ethereum").should(
            "include",
            BigNumber(response.body.EVM.WBTC).toFixed(8)
          );
          cy.getLiquidityBySymbolChain("ETH", "Ethereum").should(
            "include",
            BigNumber(response.body.EVM.ETH).toFixed(8)
          );
          cy.getLiquidityBySymbolChain("USDT", "Ethereum").should(
            "include",
            BigNumber(response.body.EVM.USDT).toFixed(8)
          );
          cy.getLiquidityBySymbolChain("USDC", "Ethereum").should(
            "include",
            BigNumber(response.body.EVM.USDC).toFixed(8)
          );
          cy.getLiquidityBySymbolChain("EUROC", "Ethereum").should(
            "include",
            BigNumber(response.body.EVM.EUROC).toFixed(8)
          );
        });
      }
    });
  });
});

context(`Liquidity page on ${mobileViewPort}`, () => {
  beforeEach(() => {
    cy.visit(urls[1]);
    cy.viewport(<Cypress.ViewportPreset>mobileViewPort);
  });

  it("should check navigation between Bridge and Liquidity pages", () => {
    cy.get("a[data-testid='Navigation.Bridge']")
      .last()
      .should("be.visible")
      .click();
    cy.url().should("not.contain", "liquidity");
    cy.get("a[data-testid='Navigation.Liquidity']")
      .last()
      .should("be.visible")
      .click();
    cy.url().should("contain", "liquidity");
  });

  it("should check responsive design for the Liquidity table elements", () => {
    cy.get("svg[data-testid='Mobile.Card.DropdownArrow']").should(
      "have.length",
      6
    );

    cy.viewport(<Cypress.ViewportPreset>desktopViewPort);
    cy.get("svg[data-testid='Mobile.Card.DropdownArrow']").should(
      "have.length",
      0
    );
  });
});
