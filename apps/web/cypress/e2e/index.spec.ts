const footerLinks = [
  { id: "youtube", url: "https://www.youtube.com/DeFiChain" },
  { id: "reddit", url: "https://www.reddit.com/r/defiblockchain" },
  { id: "gitHub", url: "https://github.com/DeFiCh" },
  { id: "twitter", url: "https://twitter.com/defichain" },
];

describe("Navigation", () => {
  it("should navigate to the home page", () => {
    cy.visit("http://localhost:3000/");

    cy.findByTestId("homepage").should("exist");
    cy.findByTestId("bridge-logo").should("exist");
    cy.findByTestId("connect-button").should("exist");

    footerLinks.forEach((footerLink) => {
      cy.findByTestId(footerLink.id)
        .should("be.visible")
        .should("have.attr", "href")
        .and("contain", footerLink.url);
    });
  });

  it("should navigate to 404 page when random url is accessed", () => {
    cy.request({ url: "/random-url", failOnStatusCode: false })
      .its("status")
      .should("equal", 404);
    cy.visit("/random-url", { failOnStatusCode: false });
    cy.contains("h1", "Page Not Found");
  });
});
