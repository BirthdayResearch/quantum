const testAnnouncements = [
  {
    id: "1",
    lang: {
      en: "Join us on this exciting journey as we connect DeFiChain and Ethereum through Quantum",
    },
    version: ">=0.0.0",
    url: "",
  },
];

const testAnnouncementsWithUrl = [
  {
    id: "1",
    lang: {
      en: "Join us on this exciting journey as we connect DeFiChain and Ethereum through Quantum",
    },
    version: ">=0.0.0",
    url: "https://birthdayresearch.notion.site/birthdayresearch/Quantum-Documentation-dc1d9174dd294b06833e7859d437e25e",
  },
];

describe("QA-755-18 Announcement Banner", () => {
  beforeEach(() => {
    cy.visitBridgeHomePage();
  });

  it("should display announcement banner", () => {
    cy.intercept("**/bridge/announcements", {
      statusCode: 200,
      body: testAnnouncements,
    });
    cy.findByTestId("announcement_banner").should("exist");
    cy.findByTestId("announcement-url-icon").should("not.exist");
  });

  it("should verify banner external url icon and close icon", () => {
    cy.intercept("**/bridge/announcements", {
      statusCode: 200,
      body: testAnnouncementsWithUrl,
    });
    cy.findByTestId("announcement_banner").should("exist");
    cy.verifyExternalLinks({
      testId: "announcement-url",
      url: "https://birthdayresearch.notion.site/birthdayresearch/Quantum-Documentation-dc1d9174dd294b06833e7859d437e25e",
    });
    // close banner
    cy.findByTestId("announcement-close-icon").click();
    cy.findByTestId("announcement_banner").should("not.exist");
  });

  it("should handle failed API announcement calls", () => {
    cy.intercept("**/bridge/announcements", {
      statusCode: 500,
      body: "Error!",
    });
    cy.findByTestId("announcement_banner").should("not.exist");
  });

  it("should handle empty announcements", () => {
    cy.intercept("**/bridge/announcements", {
      statusCode: 200,
      body: [],
    });
    cy.findByTestId("announcement_banner").should("not.exist");
  });
});
