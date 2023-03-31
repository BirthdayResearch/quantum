const BirthdayResearchSocialLinks = [
  { testId: "twitter-br", url: "https://twitter.com/BirthdayDev" },
  { testId: "medium-br", url: "https://medium.com/@birthdayresearch" },
  {
    testId: "gitHub-br",
    url: "https://github.com/BirthdayResearch/quantum-app",
  },
];

const QuantumHelperLinks = [
  {
    testId: "documentation-link",
    url: "https://birthdayresearch.notion.site/birthdayresearch/Quantum-Documentation-dc1d9174dd294b06833e7859d437e25e",
  },
  {
    testId: "faqs-link",
    url: "https://birthdayresearch.notion.site/FAQs-58af5cc140de432e8c9d1510ead3e3c0",
  },
];

const QuantumVersionQuery = "http://localhost:5741/version";

beforeEach(() => {
  cy.visitBridgeHomePage();
});

context("QA-755 Pre-connected - Navigational", () => {
  it("1: Verify Documentation and FAQs links", () => {
    QuantumHelperLinks.forEach((QuantumHelperLink) => {
      cy.verifyExternalLinks(QuantumHelperLink);
    });
  });

  it("2: Verify Quantum logo redirection", () => {
    // TODO:: after #807 is merged due to internal link component
    // cy.findByTestId("quantum-logo-header").should("be.visible").click();
  });

  it("3: Verify Banner functionality", () => {
    cy.findByTestId("header-banner")
      .should("be.visible")
      .contains(
        "Make sure you are visiting https://quantumbridge.app – check the URL correctly."
      );

    cy.findByTestId("header-banner-content-link")
      .should("have.attr", "href")
      .and("include", "https://quantumbridge.app");
  });

  it("4: Verify Footer functionality", () => {
    cy.findByTestId("footer").should("be.visible");
    cy.findByTestId("footer-quantum-logo").should("be.visible");

    // verify the quantum version
    cy.request(QuantumVersionQuery).then((response) => {
      cy.findByTestId("footer-quantum-version")
        .should("be.visible")
        .contains(`Version ${response.body.v}`);
    });

    // verify footer BR socials links
    BirthdayResearchSocialLinks.forEach((BirthdayResearchSocialLink) => {
      cy.verifyExternalLinks(BirthdayResearchSocialLink);
    });
  });

  it("5: Verify navigate to 404 page when random url is accessed", () => {
    cy.request({ url: "/random-url", failOnStatusCode: false })
      .its("status")
      .should("equal", 404);
    cy.visit("/random-url", { failOnStatusCode: false });
    cy.contains("h1", "Page Not Found");
  });
});
