beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});

describe("Move Tickets to Done in Jira", () => {
  it("updates all tickets in the filter list to 'Done'", () => {
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
    cy.wait(6000);

    // Use the JiraFilter methods to switch to JQL mode and enter the query
    jiraFilter.switchToJQLModeIfNeeded();
    jiraFilter.enterJQLQuery3(); // Use the new simplified method for this test

    cy.get(jiraFilter.ticketList, { timeout: 60000 })
      .should("be.visible")
      .then(($tickets) => {
        // Process tickets one at a time
        const processTicket = () => {
          cy.get(jiraFilter.ticketList)
            .first()
            .scrollIntoView()
            .should("be.visible")
            .within(() => {
              jiraFilter.selectTicket($tickets[0]); // Select the first ticket
            });

          cy.wait(3000);

          // Click the Sprint Field and update the status to "Done"
          jiraFilter.statusTransitionButton
            .eq(3) // Select the "Done" option by index
            .should("be.visible")
            .click({ force: true });

          cy.go("back");
          cy.wait(2000);

          // Re-enter the JQL and check for tickets again
          jiraFilter.enterJQLQuery3(); // Re-run the query using the new method

          // Check if there are more tickets
          cy.get(jiraFilter.ticketList).then((remainingTickets) => {
            if (remainingTickets.length > 0) {
              processTicket();
            }
          });
        };

        // Start processing
        processTicket();
      });
  });
});
