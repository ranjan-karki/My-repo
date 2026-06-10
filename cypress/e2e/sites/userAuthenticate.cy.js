/// <reference types="cypress" />

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress

describe('example to-do app', () => {
  beforeEach(() => {


  })

  it('displays two todo items by default', () => {
    cy.Post('/auth/authenticate?domain=www', { username: 'Ranjan.Karki@ensue.us', password: 'Ranjan!1' })
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.body).to.have.property('access_token');
        cy.log(response.body.body.access_token);
        ;
        //expect(response.body).to.have.property('token');
      });
  })

})
