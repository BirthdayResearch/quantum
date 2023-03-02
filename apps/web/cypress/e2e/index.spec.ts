const BirthdayResearchSocialItems = [
  { id: "twitter_br", url: "https://twitter.com/BirthdayDev" },
  { id: "medium_br", url: "https://medium.com/@birthdayresearch" },
  { id: "gitHub_br", url: "https://github.com/BirthdayResearch" },
];

beforeEach(() => {
  cy.visit("http://localhost:3000/");
  cy.intercept("GET", "**/bridge/status", {
    body: { isUp: true },
  });
});

describe("Navigation", () => {
  it("should navigate to the home page", () => {
    cy.findByTestId("homepage").should("exist");
    cy.findByTestId("header-bridge-logo").should("exist");
    cy.findByTestId("connect-button").should("exist");
    cy.findByTestId("footer_web").should("be.visible");

    BirthdayResearchSocialItems.forEach((BirthdayResearchSocialItem) => {
      cy.findByTestId(BirthdayResearchSocialItem.id)
        .should("be.visible")
        .should("have.attr", "href")
        .and("contain", BirthdayResearchSocialItem.url);
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
