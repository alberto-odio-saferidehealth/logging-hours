beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});

describe("Update ticket status in Jira", () => {
  it("updates all tickets in the filter list to DONE", () => {
    // Handle exceptions
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes(
          "ResizeObserver loop completed with undelivered notifications"
        ) ||
        err.message.includes("Failed to execute 'removeChild'") ||
        err.message.includes("Timeout")
      ) {
        return false; // Prevent Cypress from failing the test
      }
      throw err;
    });

    // Set the necessary cookies for Jira authentication
    cy.setCookie("JSESSIONID", "place-your-cookie-here");
    cy.setCookie("ajs_anonymous_id", "place-your-cookie-here");
    cy.setCookie("atlassian.xsrf.token", "place-your-cookie-here");
    cy.setCookie("tenant.session.token", "place-your-cookie-here");

    // Visit Jira filter URL
    cy.visit("https://saferidehealth.atlassian.net/issues/?filter=10353");

    // Wait for the page to load
    cy.wait(6000);

    // Function to input the JQL query
    const enterJQLQuery = () => {
      const jqlQuery = `project = "GL" AND status = "Done in sandbox" ORDER BY created DESC`;
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
                cy.log("Switched to JQL mode.");
              }
            } else {
              cy.log("Already in JQL mode.");
            }
          });
        });

      // Focus on the JQL editor and type the query
      cy.get('div[data-testid="jql-editor-input"]', { timeout: 10000 })
        .should("be.visible")
        .click()
        .focused()
        .clear()
        .type(`${jqlQuery}{enter}`, { delay: 50 });

      cy.wait(3000); // Allow results to reload
    };

    // Start processing tickets
    enterJQLQuery();

    cy.get(
      'ul[aria-label="Issues"] li[data-testid^="issue-navigator.ui.issue-results.detail-view.card-list.card.list-item"]',
      { timeout: 60000 }
    )
      .should("be.visible")
      .then(($tickets) => {
        cy.log(`Found ${$tickets.length} tickets.`);

        // Process tickets one at a time
        const processTicket = () => {
          cy.get(
            'ul[aria-label="Issues"] li[data-testid^="issue-navigator.ui.issue-results.detail-view.card-list.card.list-item"]'
          )
            .first()
            .scrollIntoView()
            .should("be.visible")
            .within(() => {
              cy.get('a[href^="/browse/GL"]').click({ force: true });
            });

          cy.wait(3000);

          // Update status
          cy.contains("span", "Done in sandbox", { timeout: 10000 })
            .should("be.visible")
            .click({ force: true });

          cy.wait(1000);

          cy.get(
            'div[data-testid="issue-field-status.ui.status-view.transition"]'
          )
            .eq(3)
            .should("be.visible")
            .click({ force: true });

          cy.log("Ticket updated to DONE.");
          cy.go("back");
          cy.wait(2000);

          // Re-enter the JQL and check for tickets again
          enterJQLQuery();

          // Check if there are more tickets
          cy.get(
            'ul[aria-label="Issues"] li[data-testid^="issue-navigator.ui.issue-results.detail-view.card-list.card.list-item"]'
          ).then((remainingTickets) => {
            if (remainingTickets.length > 0) {
              processTicket();
            } else {
              cy.log("All tickets have been processed.");
            }
          });
        };

        // Start processing
        processTicket();
      });
  });
});
