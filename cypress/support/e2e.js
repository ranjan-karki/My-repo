// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

before(() => {
    cy.request({
        method: 'GET',
        url: '/',
        failOnStatusCode: false,
        timeout: 60000,
    });
});

afterEach(function () {
    if (this.currentTest.state === 'failed') {
        const req = Cypress.env('lastRequest');
        const res = Cypress.env('lastResponse');
        cy.log('--- FAILED TEST DEBUG ---');
        cy.log('Request body: ' + JSON.stringify(req?.body));
        cy.log('Response status: ' + res?.status);
        cy.log('Response body: ' + JSON.stringify(res?.body));
    }
});

