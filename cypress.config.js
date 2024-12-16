const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    viewportWidth: 1920,
    viewportHeight: 1080,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 0,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    defaultCommandTimeout: 15000, // Default timeout for commands
    requestTimeout: 20000, // Timeout for network requests
    pageLoadTimeout: 30000,
  },
});
