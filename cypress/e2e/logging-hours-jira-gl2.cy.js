beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});

describe("log work hours", () => {
  it("logs into Jira and applies the filter for a specific sprint", () => {
    // Handle exceptions
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes(
          "ResizeObserver loop completed with undelivered notifications"
        ) ||
        err.message.includes("Store embedded-confluence-panel-container") ||
        err.message.includes("Failed to execute 'removeChild'") ||
        err.message.includes("Timeout") ||
        err.message.includes("unhandled promise rejection")
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
    cy.visit("https://saferidehealth.atlassian.net/issues/?filter=10221");

    // Wait for the page to load
    cy.wait(6000);

    // Switch to JQL mode if needed
    jiraFilter.switchToJQLModeIfNeeded();

    // Enter the JQL query with the sprint id from the environment variable
    const sprintValue = Cypress.env("sprintid");
    const role = Cypress.env("role");
    const pod = Cypress.env("pod");
    if (!sprintValue || !role || !pod) {
      throw new Error(
        "sprint id, role, and pod are required. Pass them as environment variables."
      );
    } else {
      jiraFilter.enterJQLQuery(sprintValue, role, pod); // Use the appropriate JQL based on role and pod
    }

    // Wait for the ticket list to load
    cy.get(jiraFilter.ticketList, { timeout: 60000 })
      .should("be.visible")
      .then(($tickets) => {
        const ticketsWithoutLog = [];

        // Process the first ticket (already opened by default)
        cy.wrap(null).then(() => {
          // Scroll to "Activity" section
          jiraFilter.scrollToActivitySection();

          // Switch to the "Work log" tab
          jiraFilter.clickWorkLogTab();

          // Check if "Log work" button exists
          jiraFilter.checkForLogWorkButton().then(($button) => {
            if ($button.length > 0) {
              ticketsWithoutLog.push($tickets[0]);
            } else {
              // If "Log work" button doesn't exist, check if work logs are already present
              jiraFilter.checkForExistingWorkLogs(
                $tickets[0],
                ticketsWithoutLog
              );
            }
          });
        });

        // Process each remaining ticket
        cy.wrap($tickets)
          .each(($el, index) => {
            if (index === 0) return;

            cy.wrap($el)
              .scrollIntoView()
              .should("be.visible")
              .then(() => {
                jiraFilter.selectTicket($el);
                cy.wait(2000);

                // Switch to "Work log" tab
                jiraFilter.clickWorkLogTab();

                // Check for the "Log work" button or clock icon
                jiraFilter.checkForLogWorkButton().then(($button) => {
                  if ($button.length > 0) {
                    ticketsWithoutLog.push($el);
                  } else {
                    // If "Log work" button is missing, check for existing work logs
                    jiraFilter.checkForExistingWorkLogs($el, ticketsWithoutLog);
                  }
                });
              });
          })
          .then(() => {
            // Calculate hours per ticket
            const ticketsToLogCount = ticketsWithoutLog.length;
            const hoursPerTicket = 70 / ticketsToLogCount;

            if (ticketsToLogCount > 0) {
              // Process the first ticket
              jiraFilter.selectTicket(ticketsWithoutLog[0]);

              // Wait for page load and log time
              cy.wait(3000);
              jiraFilter.logTime(hoursPerTicket.toFixed(2));
              cy.wait(2000);
            }

            // Now process the remaining tickets
            if (ticketsToLogCount > 1) {
              cy.wrap(ticketsWithoutLog.slice(1)).each(($ticket) => {
                // Click the next ticket and log time
                jiraFilter.selectTicket($ticket);

                cy.wait(3000);
                jiraFilter.logTime(hoursPerTicket.toFixed(2));
                cy.wait(2000);
              });
            }
          });
      });
  });
});
