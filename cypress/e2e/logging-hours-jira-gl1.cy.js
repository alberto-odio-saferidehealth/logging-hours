beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});
describe("log work hours", () => {
  it("logs into Jira and applies the filter for a specific sprint", () => {
    // Handle exceptions for ResizeObserver
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes(
          "ResizeObserver loop completed with undelivered notifications"
        ) ||
        err.message.includes("Store embedded-confluence-panel-container") ||
        err.message.includes("Failed to execute 'removeChild'")
      ) {
        return false; // Prevent Cypress from failing the test due to these specific errors
      }

      // Throw other unexpected errors so the test can fail correctly
      throw err;
    });

    // Set the necessary cookies for Jira authentication
    cy.setCookie("JSESSIONID", "place-your-cookie-here");
    cy.setCookie("ajs_anonymous_id", "place-your-cookie-here");
    cy.setCookie("atlassian.xsrf.token", "place-your-cookie-here");
    cy.setCookie("tenant.session.token", "place-your-cookie-here");
    // Visit Jira filter URL
    cy.visit("https://saferidehealth.atlassian.net/issues/?filter=10221");

    // Check if we are in BASIC mode and force a switch to JQL if necessary
    cy.get('label[for="toggle-buttons-3-advanced"]', { timeout: 10000 }).then(
      ($label) => {
        cy.get('div[class*="css"]').then(($div) => {
          if ($div.hasClass("css-zkrq6v")) {
            // We are in BASIC mode, click the label to switch to JQL
            cy.wrap($label).click();
          }
        });
      }
    );

    // Wait for the profile image (span) to become visible and then click on it
    cy.get(
      'div[data-testid="atlassian-navigation--secondary-actions--profile--menu-trigger"]',
      { timeout: 10000 }
    )
      .should("be.visible")
      .click();

    // Get the user's name from the dropdown
    cy.get("div._vwz4gktf")
      .invoke("text")
      .then((userName) => {
        // Wait for the JQL editor input to become available
        cy.get('div[data-testid="jql-editor-input"]', { timeout: 60000 })
          .should("be.visible")
          .then(($editor) => {
            // Use environment variables for sprint ID and role
            const sprintValue = Cypress.env("sprintID"); // Get sprint ID from environment variable
            const role = Cypress.env("role"); // Get role from environment variable

            if (!sprintValue || !role) {
              throw new Error(
                "Both Sprint ID and role are required. Pass them as environment variables."
              );
            } else {
              // Define the JQL queries
              const devJQL = `project = "GL" AND ("developer owner[people]" = currentUser()) AND sprint = ${sprintValue} AND status IN ("Done in sandbox", "Done", "PO validation", "Code review", "In QA", "Ready for QA") ORDER BY created DESC`;
              const qaJQL = `project = "GL" AND ("qa owner[user picker (single user)]" = currentUser()) AND sprint = ${sprintValue} AND status IN ("Done in sandbox", "Done", "PO validation") ORDER BY created DESC`;

              // Select the appropriate JQL based on the role
              const jqlQuery = role === "dev" ? devJQL : qaJQL;

              // Focus the JQL editor, clear existing content, and type the query
              cy.wrap($editor).click().focused().clear();
              cy.wrap($editor).type(`${jqlQuery}{enter}`, { delay: 100 });

              // Wait for the ticket list to load
              cy.get(
                'ul[aria-label="Issues"] li[data-testid^="issue-navigator.ui.issue-results.detail-view.card-list.card.list-item"]',
                { timeout: 60000 }
              )
                .should("be.visible")
                .then(($tickets) => {
                  const totalTicketCount = $tickets.length;
                  let ticketsWithoutLog = [];

                  // Process the first ticket (already opened by default)
                  cy.wrap(null).then(() => {
                    // Scroll to "Activity" section
                    cy.get(
                      'h2[data-testid="issue-activity-feed.heading"]'
                    ).scrollIntoView({
                      block: "center",
                    });

                    // Switch to the "Work log" tab
                    cy.get(
                      'button[data-testid="issue-activity-feed.ui.buttons.Worklog"]',
                      {
                        timeout: 10000,
                      }
                    )
                      .should("be.visible")
                      .click({ force: true })
                      .then(() => {
                        cy.wait(3000); // Wait for the Work log tab content to load

                        // Check for the "Log work" button or clock icon
                        cy.get("body").then(($body) => {
                          if (
                            $body.find("span.css-178ag6o:contains('Log work')")
                              .length > 0
                          ) {
                            // "Log work" button exists, meaning no work is logged
                            ticketsWithoutLog.push($tickets[0]); // Add to the list of tickets without logs
                          } else {
                            // If "Log work" button is not present, check for existing work logs
                            cy.get("body").then(($body) => {
                              if (
                                $body.find(
                                  'div[data-testid^="issue-worklog-item.activity-item"]'
                                ).length > 0
                              ) {
                                // Work logs exist, check if the user has already logged time
                                cy.get(
                                  'div[data-testid^="issue-worklog-item.activity-item"]'
                                ).then(($worklogs) => {
                                  const userLogged = $worklogs
                                    .find("span")
                                    .toArray()
                                    .some((log) =>
                                      log.innerText.includes(userName)
                                    );

                                  if (!userLogged) {
                                    ticketsWithoutLog.push($tickets[0]); // Add to the list of tickets without logs
                                  }
                                });
                              } else {
                                // No work logs at all
                                ticketsWithoutLog.push($tickets[0]);
                              }
                            });
                          }
                        });
                      });
                  });

                  // Process each remaining ticket
                  cy.wrap($tickets)
                    .each(($el, index) => {
                      if (index === 0) {
                        return; // Skip the first ticket
                      }

                      cy.wrap($el)
                        .should("exist")
                        .scrollIntoView()
                        .then(() => {
                          // Click the ticket
                          cy.wrap($el)
                            .find('a[href^="/browse/GL-"]')
                            .should("be.visible")
                            .click({ force: true });

                          // Wait for page load
                          cy.wait(2000);

                          // Scroll to "Activity" section
                          cy.get(
                            'h2[data-testid="issue-activity-feed.heading"]'
                          ).scrollIntoView({
                            block: "center",
                          });

                          // Switch to the "Work log" tab
                          cy.get(
                            'button[data-testid="issue-activity-feed.ui.buttons.Worklog"]',
                            {
                              timeout: 10000,
                            }
                          )
                            .should("be.visible")
                            .click({ force: true })
                            .then(() => {
                              cy.wait(3000); // Wait for the Work log tab content to load

                              // Check for the "Log work" button or clock icon
                              cy.get("body").then(($body) => {
                                if (
                                  $body.find(
                                    "span.css-178ag6o:contains('Log work')"
                                  ).length > 0
                                ) {
                                  ticketsWithoutLog.push($el); // Add to the list of tickets without logs
                                } else {
                                  // Log work button does not exist, check if work logs exist
                                  cy.get("body").then(($body) => {
                                    if (
                                      $body.find(
                                        'div[data-testid^="issue-worklog-item.activity-item"]'
                                      ).length > 0
                                    ) {
                                      // Work logs exist, check if the user has already logged time
                                      cy.get(
                                        'div[data-testid^="issue-worklog-item.activity-item"]'
                                      ).then(($worklogs) => {
                                        const userLogged = $worklogs
                                          .find("span")
                                          .toArray()
                                          .some((log) =>
                                            log.innerText.includes(userName)
                                          );

                                        if (!userLogged) {
                                          ticketsWithoutLog.push($el); // Add to the list of tickets without logs
                                        }
                                      });
                                    } else {
                                      // No work logs at all
                                      ticketsWithoutLog.push($el);
                                    }
                                  });
                                }
                              });
                            });
                        });
                    })
                    .then(() => {
                      // Calculate hours based on tickets that need logging
                      const ticketsToLogCount = ticketsWithoutLog.length;
                      const hoursPerTicket = 70 / ticketsToLogCount;

                      // Ensure we are processing the first ticket first
                      if (ticketsToLogCount > 0) {
                        // Click the first ticket explicitly using data-testid for reliability
                        cy.wrap(ticketsWithoutLog[0])
                          .scrollIntoView()
                          .should("be.visible")
                          .within(() => {
                            cy.get(
                              'div[data-testid="issue-navigator.ui.issue-results.detail-view.card-list.card.summary"]'
                            )
                              .invoke("text")
                              .then((firstTicketText) => {
                                cy.contains(firstTicketText).click({
                                  force: true,
                                });
                              });
                          });

                        // Wait for the page to load
                        cy.wait(3000);

                        // Scroll to and click the Time tracking element using its full class list
                        cy.get(
                          "div._ca0qidpf._n3tdidpf._19bv12x7._u5f3idpf._2hwx1i6y._1tke1ejb"
                        )
                          .scrollIntoView()
                          .should("be.visible")
                          .click({ force: true });

                        // Wait for the time tracking UI to load
                        cy.wait(3000);

                        // Enter the calculated hours
                        cy.get(
                          'input[aria-label="Time spent"][data-ds--text-field--input="true"]'
                        )
                          .should("be.visible")
                          .type(`${hoursPerTicket.toFixed(2)}h`, {
                            force: true,
                          });

                        // Wait for the Save button to become enabled before clicking
                        cy.get("button.css-1jk3zmn") // Use the button's class that was shown in your previous screenshot
                          .should("exist") // Ensure the button exists
                          .should("not.be.disabled") // Wait until it's no longer disabled
                          .click({ force: true }); // Force the click

                        // Wait to make sure it completes logging
                        cy.wait(2000);
                      }

                      // Now process the remaining tickets
                      if (ticketsToLogCount > 1) {
                        cy.wrap(ticketsWithoutLog.slice(1)).each(
                          ($ticket, index) => {
                            // Click the next ticket using the data-testid
                            cy.wrap($ticket)
                              .scrollIntoView()
                              .should("be.visible")
                              .within(() => {
                                cy.get(
                                  'div[data-testid="issue-navigator.ui.issue-results.detail-view.card-list.card.summary"]'
                                )
                                  .invoke("text")
                                  .then((ticketText) => {
                                    cy.contains(ticketText).click({
                                      force: true,
                                    });
                                  });
                              });

                            // Wait for the page to load
                            cy.wait(3000);

                            // Scroll to and click the Time tracking element using its full class list
                            cy.get(
                              "div._ca0qidpf._n3tdidpf._19bv12x7._u5f3idpf._2hwx1i6y._1tke1ejb"
                            )
                              .scrollIntoView()
                              .should("be.visible")
                              .click({ force: true });

                            // Wait for the time tracking UI to load
                            cy.wait(3000);

                            // Enter the calculated hours
                            cy.get(
                              'input[aria-label="Time spent"][data-ds--text-field--input="true"]'
                            )
                              .should("be.visible")
                              .type(`${hoursPerTicket.toFixed(2)}h`, {
                                force: true,
                              });

                            // Wait for the Save button to become enabled before clicking
                            cy.get("button.css-1jk3zmn") // Use the button's class that was shown in your previous screenshot
                              .should("exist") // Ensure the button exists
                              .should("not.be.disabled") // Wait until it's no longer disabled
                              .click({ force: true }); // Force the click

                            // Wait to make sure it completes logging
                            cy.wait(2000);
                          }
                        );
                      }
                    });
                });
            }
          });
      });
  });
});
