//to run, open terminal, type in the following and hit enter: npx cypress open --env sprintid=1657,role=qa,pod=gl1
beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});
describe("log work hours", () => {
  it("logs into Jira and applies the filter for a specific sprint", () => {
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
        return false;
      }
      throw err;
    });
    // Set the necessary cookies for Jira authentication
    cy.setCookie("JSESSIONID", "place-your-cookie-here");
    cy.setCookie("ajs_anonymous_id", "place-your-cookie-here");
    cy.setCookie("atlassian.xsrf.token", "place-your-cookie-here");
    cy.setCookie("tenant.session.token", "place-your-cookie-here");

    cy.visit("https://saferidehealth.atlassian.net/issues/?filter=10221");
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
        const sprintValue = Cypress.env("sprintid");
        const role = Cypress.env("role");
        const pod = Cypress.env("pod");
        if (!sprintValue || !role || !pod) {
          throw new Error(
            "sprint id, role, and pod are required. Pass them as environment variables."
          );
        } else {
          const jqlQueries = {
            gl1: {
              dev: `project = "GL" AND ("developer owner[people]" = currentUser()) AND sprint = ${sprintValue} AND status IN ("Done in sandbox", "Done", "PO validation", "Code review", "Ready for QA", "In QA") ORDER BY created DESC`,
              qa: `project = "GL" AND ("qa owner[user picker (single user)]" = currentUser()) AND sprint = ${sprintValue} AND status IN ("Done in sandbox", "Done", "PO validation", "In QA") ORDER BY created DESC`,
            },
            gl2: {
              dev: `project = "GL2" AND ("user story dev owner[people]" = currentUser()) OR ("Task Dev Owner[People]" = currentUser()) AND sprint = ${sprintValue} AND status IN ("Done in Sandbox", "PO validation", "Delivered to release branch", "Code review", "In QA", "Ready for QA") ORDER BY created DESC`,
              qa: `project = "GL2" AND ("qa owner[user picker (single user)]" = currentUser()) AND sprint = ${sprintValue} AND status IN ("Done in Sandbox", "PO validation", "Delivered to release branch", "In QA") ORDER BY created DESC`,
            },
            gl3: {
              dev: `project = "GL3" AND ("developer owner[people]" = currentUser()) AND sprint = ${sprintValue} AND status IN ("Done in sandbox", "Done", "PO validation", "Code review", "In QA", "Ready for QA") ORDER BY created DESC`,
              qa: `project = "GL3" AND ("qa owner[people]" = currentUser()) AND sprint = ${sprintValue} AND status IN ("Done in sandbox", "Done", "PO validation", "In QA") ORDER BY created DESC`,
            },
          };
          const jqlQuery = jqlQueries[pod][role];
          cy.wait(6000);
          cy.wrap($editor).click().focused().clear();
          cy.wrap($editor).type(`${jqlQuery}{enter}`, { delay: 100 });
          cy.get(
            'ul[aria-label="Issues"] li[data-testid^="issue-navigator.ui.issue-results.detail-view.card-list.card.list-item"]',
            { timeout: 60000 }
          )
            .should("be.visible")
            .then(() => {
              cy.get(
                'div[data-testid="issue-navigator.ui.issue-results.detail-view.card-container.total-count"] span'
              )
                .should("be.visible")
                .invoke("text")
                .then((text) => {
                  const totalTicketCount = parseInt(text.split(" ")[0]);
                  const hoursPerTicket = 70 / totalTicketCount;
                  cy.get(
                    'div[data-testid="issue.component.progress-tracker.progress-bar.progress-bar-container"]',
                    {
                      timeout: 10000,
                    }
                  )
                    .scrollIntoView()
                    .should("exist")
                    .click({ force: true })
                    .then(() => {
                      cy.wait(3000);
                      cy.get(
                        'input[aria-label="Time spent"][data-ds--text-field--input="true"]'
                      )
                        .should("be.visible")
                        .type(`${hoursPerTicket.toFixed(2)}h`, {
                          force: true,
                        });
                      cy.get(
                        'button[data-testid="issue.common.component.log-time-modal.modal.footer.save-button"]'
                      )
                        .should("exist")
                        .should("not.be.disabled")
                        .click({ force: true });
                      cy.wait(2000);
                      cy.get(
                        'ul[aria-label="Issues"] li[data-testid^="issue-navigator.ui.issue-results.detail-view.card-list.card.list-item"]'
                      ).each(($el, index) => {
                        if (index === 0) return;
                        cy.wrap($el)
                          .should("exist")
                          .scrollIntoView()
                          .then(() => {
                            cy.wrap($el)
                              .find('a[href^="/browse/GL"]')
                              .should("be.visible")
                              .click({ force: true });
                            cy.wait(2000);
                            cy.get(
                              'div[data-testid="issue.component.progress-tracker.progress-bar.progress-bar-container"]',
                              {
                                timeout: 10000,
                              }
                            )
                              .scrollIntoView()
                              .should("exist")
                              .click({ force: true })
                              .then(() => {
                                cy.wait(3000);
                                cy.get(
                                  'input[aria-label="Time spent"][data-ds--text-field--input="true"]'
                                )
                                  .should("be.visible")
                                  .type(`${hoursPerTicket.toFixed(2)}h`, {
                                    force: true,
                                  });
                                cy.get(
                                  'button[data-testid="issue.common.component.log-time-modal.modal.footer.save-button"]'
                                )
                                  .should("exist")
                                  .should("not.be.disabled")
                                  .click({ force: true });
                                cy.wait(2000);
                              });
                          });
                      });
                    });
                });
            });
        }
      });
  });
});
