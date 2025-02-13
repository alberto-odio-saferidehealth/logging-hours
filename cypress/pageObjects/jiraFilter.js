class JiraFilter {
  // Selectors
  get jqlEditor() {
    return cy.get('div[data-testid="jql-editor-input"]');
  }

  get toggleToJQLButton() {
    return cy.get('label[for^="toggle-buttons-"][for$="-advanced"]');
  }

  get profileMenuTrigger() {
    return cy.get(
      'div[data-testid="atlassian-navigation--secondary-actions--profile--menu-trigger"]'
    );
  }

  get profileUserName() {
    return cy.get("div._vwz4gktf");
  }

  get ticketList() {
    return cy.get(
      'ul[aria-label="Issues"] li[data-testid^="issue-navigator.ui.issue-results.detail-view.card-list.card.list-item"]'
    );
  }

  get workLogTab() {
    return cy.get(
      'button[data-testid="issue-activity-feed.ui.buttons.Worklog"]'
    );
  }

  get logWorkButton() {
    return cy.get(
      'button[data-testid="issue.activity.worklog.worklog-items.empty-state.worklog-button-click"]'
    );
  }

  get timeTracking() {
    return cy.get(
      'div[data-testid="issue.component.progress-tracker.progress-bar.progress-bar-container"]'
    );
  }

  get statusTransitionButton() {
    return cy.get(
      'div[data-testid="issue-field-status.ui.status-view.transition"]'
    );
  }

  get logWorkButtonSpan() {
    return cy.get(
      'button[data-testid="issue.activity.worklog.worklog-items.empty-state.worklog-button-click"] span:contains("Log work")'
    );
  }

  // Action Selectors
  get activitySection() {
    return cy.get('h2[data-testid="issue-activity-feed.heading"]');
  }

  get workLogTabButton() {
    return cy.get(
      'button[data-testid="issue-activity-feed.ui.buttons.Worklog"]'
    );
  }

  get workLogItem() {
    return cy.get('div[data-testid^="issue-worklog-item.activity-item"]');
  }

  get saveButton() {
    return cy.get(
      'button[data-testid="issue.common.component.log-time-modal.modal.footer.save-button"]'
    );
  }

  get timeSpentInput() {
    return cy.get(
      'input[aria-label="Time spent"][data-ds--text-field--input="true"]'
    );
  }

  // Actions
  switchToJQLModeIfNeeded() {
    const toggleButton = this.toggleToJQLButton;
    const searchFieldSelector = '[data-test-id="searchfield"]';

    toggleButton.should("exist").then(($label) => {
      cy.get("body").then(($body) => {
        if ($body.find(searchFieldSelector).length > 0) {
          const $searchField = $body.find(searchFieldSelector);
          if ($searchField.is(":visible")) {
            cy.wrap($label).click({ force: true });
          }
        }
      });
    });
  }

  enterJQLQuery(sprintValue, role, pod) {
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
    this.jqlEditor.should("be.visible").click().focused().clear();
    this.jqlEditor.type(`${jqlQuery}{enter}`, { delay: 100 });
  }

  enterJQLQuery2(sprintId) {
    const jqlQuery = `project = "GL" AND status IN (Done, "Done in sandbox") AND sprint = ${sprintId} ORDER BY created DESC`;

    this.jqlEditor.should("be.visible").click().focused().clear();
    this.jqlEditor.type(`${jqlQuery}{enter}`, { delay: 50 });

    cy.wait(3000); // Allow results to reload
  }

  enterJQLQuery3() {
    const jqlQuery = `project = "GL" AND status IN ("Done in sandbox", "Done") ORDER BY created DESC`;

    this.jqlEditor.should("be.visible").click().focused().clear();
    this.jqlEditor.type(`${jqlQuery}{enter}`, { delay: 50 });

    cy.wait(3000); // Allow results to reload
  }

  selectTicket(ticket) {
    ticket
      .find('a[href^="/browse/GL"]')
      .should("be.visible")
      .click({ force: true });
  }

  clickWorkLogTab() {
    this.workLogTabButton.should("be.visible").click({ force: true });
  }

  clickLogWorkButton() {
    this.logWorkButton.should("be.visible").click({ force: true });
  }

  logTime(hours) {
    this.timeTracking.scrollIntoView().should("exist").click({ force: true });

    cy.wait(3000);

    this.timeSpentInput.should("be.visible").type(`${hours}h`, { force: true });

    this.saveButton
      .should("exist")
      .should("not.be.disabled")
      .click({ force: true });

    cy.wait(2000);
  }

  scrollToActivitySection() {
    this.activitySection.scrollIntoView({
      block: "center",
    });
  }

  checkForExistingWorkLogs(ticket, ticketsWithoutLog) {
    cy.get("body").then(($body) => {
      if (
        $body.find('div[data-testid^="issue-worklog-item.activity-item"]')
          .length > 0
      ) {
        this.workLogItem.then(($worklogs) => {
          const userLogged = $worklogs
            .find("span")
            .toArray()
            .some((log) => log.innerText.includes(userName));

          if (!userLogged) {
            ticketsWithoutLog.push(ticket);
          }
        });
      } else {
        ticketsWithoutLog.push(ticket);
      }
    });
  }

  checkForLogWorkButton() {
    return this.logWorkButtonSpan;
  }
}

export default JiraFilter;
