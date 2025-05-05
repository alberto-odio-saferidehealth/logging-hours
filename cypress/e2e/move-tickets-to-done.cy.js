//to run, open terminal, type in the following and hit enter: npx cypress open
beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});
describe("Update ticket status in Jira", () => {
  it("updates all tickets in the filter list to DONE", () => {
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes(
          "ResizeObserver loop completed with undelivered notifications"
        ) ||
        err.message.includes("Failed to execute 'removeChild'") ||
        err.message.includes("Timeout")
      ) {
        return false;
      }
      throw err;
    });
    // Set the necessary cookies for Jira authentication
    cy.setCookie("JSESSIONID", "place-your-cookie-here");
    cy.setCookie("ajs_anonymous_id", "place-your-cookie-here");
    cy.setCookie("atlassian.xsrf.token", "place-your-cookie-here");
    cy.setCookie("tenant.session.token", "place-your-cookie-here");

    cy.visit("https://saferidehealth.atlassian.net/issues/?filter=10353");
    cy.wait(6000);
    cy.get('label[for^="toggle-buttons-"][for$="-advanced"]', {
      timeout: 10000,
    })
      .should("exist")
      .then(($label) => {
        cy.get("body").then(($body) => {
          if ($body.find('[data-test-id="searchfield"]').length > 0) {
            const $searchField = $body.find('[data-test-id="searchfield"]');
            if ($searchField.is(":visible")) {
              cy.wrap($label).click({ force: true });
            }
          }
        });
      });
    cy.get('div[data-testid="jql-editor-input"]', { timeout: 60000 })
      .should("be.visible")
      .then(($editor) => {
        const jqlQuery = `project = "GL" AND status = "Done in sandbox" ORDER BY created DESC`;
        cy.wrap($editor).click().focused().clear();
        cy.wrap($editor).type(`${jqlQuery}{enter}`, { delay: 100 });
      });
    cy.get(
      'li[data-testid="issue-navigator.ui.issue-results.detail-view.card-list.card.list-item"]',
      { timeout: 60000 }
    )
      .should("be.visible")
      .then(() => {
        cy.get('div[data-testid="issue.views.issue-details.issue-layout.visibility-container"]', { timeout: 10000 })
        .should("be.visible")
        .within(() => {
          cy.get('button[aria-label*="Done in sandbox"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true });
        });
        cy.wait(3000);
        cy.get(
          'div[data-testid="issue-field-status.ui.status-view.transition"]'
        )
          .eq(3)
          .should("be.visible")
          .click({ force: true });
        cy.get(
          'li[data-testid="issue-navigator.ui.issue-results.detail-view.card-list.card.list-item"]'
        ).each(($el, index) => {
          if (index > 0) {
            cy.wrap($el)
              .should("exist")
              .scrollIntoView()
              .then(() => {
                cy.wait(3000);
                cy.wrap($el)
                  .find('a[href^="/browse/GL"]')
                  .should("be.visible")
                  .click({ force: true });
                cy.wait(3000);
                cy.get('div[data-testid="issue.views.issue-details.issue-layout.visibility-container"]', { timeout: 10000 })
                .should("be.visible")
                .within(() => {
                  cy.get('button[aria-label*="Done in sandbox"]', { timeout: 10000 })
                    .scrollIntoView()
                    .click({ force: true });
                });
                cy.wait(3000);
                cy.get(
                  'div[data-testid="issue-field-status.ui.status-view.transition"]'
                )
                  .eq(3)
                  .should("be.visible")
                  .click({ force: true });
              });
          }
        });
      });
  });
});
