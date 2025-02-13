beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});

describe("Remove Sprint from Jira Tickets", () => {
  it("removes the sprint from all tickets in the filter list", () => {
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

    // Retrieve sprint ID from environment variables
    const sprintId = Cypress.env("sprintid"); // Example: pass via `--env sprintid=1162`

    // Visit Jira filter URL
    cy.visit("https://saferidehealth.atlassian.net/issues/?filter=10353");
    cy.wait(6000);

    // Use the JiraFilter methods to switch to JQL mode and enter the query
    jiraFilter.switchToJQLModeIfNeeded();
    jiraFilter.enterJQLQuery2(sprintId); // Use the new simplified method for this test

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

          // Click the Sprint Field and remove the Sprint
          jiraFilter.sprintField
            .should("be.visible")
            .first()
            .click({ force: true });

          // Send Backspace to Remove Sprint
          cy.get('input[role="combobox"]')
            .should("be.visible")
            .type("{backspace}", { force: true });

          // Re-enter the JQL and check for tickets again
          jiraFilter.enterJQLQuery2(sprintId); // Re-run the query using the new method

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
