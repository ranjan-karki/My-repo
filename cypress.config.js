const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://lyb.test/api",
    // baseUrl:"https://learnyourcare.com/api",
    // baseUrl: "https://aflac-staging-api.learnyourcare.com/api",

    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
