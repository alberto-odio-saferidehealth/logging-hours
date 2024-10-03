describe("log work hours", () => {
  it("logs in and submits PSA hours", () => {
    // Start by visiting the Salesforce Gorilla Logic page
    cy.visit("https://gorillalogic.lightning.force.com");
    cy.get('button[class="button mb12 secondary wide"]').click();
    cy.log("Clicked on JumpCloud login button");

    // Switch to JumpCloud origin to handle login
    cy.origin("https://console.jumpcloud.com", () => {
      cy.log("Inside JumpCloud origin");

      // Enter email and log in
      cy.get('input[name="email"]')
        .should("be.visible")
        .type("alberto.odio@gorillalogic.com");
      cy.get('button[data-automation="loginButton"]').click();
      cy.log("Entered email and clicked login");

      // Enter password and submit
      cy.get('input[name="password"]').should("be.visible").type("!B1e2t3o4o5");
      cy.get('button[data-automation="loginButton"]').click();
      cy.log("Entered password and clicked login button");

      // Wait for the 2FA input fields to appear
      cy.get('input[class*="TotpInput__loginInput"]')
        .first()
        .should("be.visible");
      cy.log("2FA input fields are visible");

      // Prompt the user to enter the 6-digit authenticator code
      cy.window().then((win) => {
        const authCode = win.prompt("Enter the 6-digit authenticator code:");
        if (authCode.length === 6) {
          // Type each digit in the corresponding input field
          for (let i = 0; i < 6; i++) {
            cy.get('input[class*="TotpInput__loginInput"]')
              .eq(i)
              .type(authCode[i]);
          }
          cy.log("Entered 2FA code");
        } else {
          throw new Error("Authenticator code must be exactly 6 digits.");
        }
      });

      // Confirm login completion
      cy.get("figure.Applications__appLogo").should("be.visible");
      cy.log("Login successful, JumpCloud is done");
    });

    // Switch back to Salesforce origin to proceed
    cy.origin("https://gorillalogic.lightning.force.com", () => {
      cy.log("Switched back to Salesforce origin");

      // Catch and handle exceptions related to Aura or undefined properties
      cy.on("uncaught:exception", (err, runnable) => {
        if (
          err.message.includes("Cannot read properties of undefined") ||
          err.message.includes("Unable to read the Aura token")
        ) {
          cy.log("Ignoring Aura token or undefined properties error");
          return false; // Prevent Cypress from failing the test
        }
      });

      // Wait for Time Entry page to load
      cy.visit(
        "https://gorillalogic.lightning.force.com/lightning/n/pse__Time_Entry"
      );
      cy.log("Navigating to Time Entry page");

      // Add a wait to ensure Salesforce has time to load
      cy.wait(5000); // Optional, adjust based on how long it takes to load
      cy.get('input[name="combo-1135-inputEl"]', { timeout: 60000 }).should(
        "be.visible"
      );
      cy.log("Time Entry page loaded and input field is visible");
    });
  });
});
