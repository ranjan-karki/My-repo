
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
    const requestBody = (args[0] && typeof args[0] === 'object' ? args[0].body : args[2]) ?? null;
    return originalFn(...args).then((response) => {
        Cypress.env('lastRequest', { body: requestBody });
        Cypress.env('lastResponse', { status: response.status, body: response.body });
        return response;
    });
});

Cypress.Commands.add('loginAndGetToken', () => {
    return cy.request({
        method: 'POST',
        url: '/auth/authenticate?domain=www',
        body: {
            username: 'Ranjan.Karki@ensue.us',
            password: 'Ensue@2026'
        },
        timeout: 60000,
    }).then((response) => {
        const token = response.body.body.access_token;
        Cypress.env('token', token); // store it for later use
        return token;
    });
});

Cypress.Commands.add('ensureAuthenticated', () => {
    const token = Cypress.env('token');

    if (!token) {
        cy.log('No token found, logging in...');
        return cy.loginAndGetToken();
    }

    // Optional: Validate token validity with a lightweight request
    // Replace '/api/user/profile' with a real endpoint that requires auth
    cy.request({
        url: '/auth/me', // Adjust this endpoint as needed
        failOnStatusCode: false,
        headers: { Authorization: `Bearer ${token}` }
    }).then((response) => {
        if (response.status === 401 || response.status === 403) {
            cy.log('Token expired or invalid, re-logging in...');
            return cy.loginAndGetToken();
        }
        cy.log('Token is valid');
    });
});

Cypress.Commands.add('GetItems', (url, options = {}) => {
    cy.request({
        method: 'GET',
        url,
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        ...options
    });
});

// POST request
Cypress.Commands.add('Post', (url, body, options = {}) => {
    cy.request({
        method: 'POST',
        url,
        body,
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        ...options
    });
});

// PUT request
Cypress.Commands.add('Put', (url, body, options = {}) => {
    cy.request({
        method: 'PUT',
        url,
        body,
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        ...options
    });
});

// DELETE request
Cypress.Commands.add('Delete', (url, options = {}) => {
    cy.request({
        method: 'DELETE',
        url,
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        ...options
    });
});

Cypress.Commands.add('generateUUID', () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uuid = '';
    const values = crypto.getRandomValues(new Uint8Array(length));
    for (let i = 0; i < length; i++) {
        uuid += charset[values[i] % charset.length];
    }
    return uuid;
});
Cypress.Commands.add('getPublicSitesToken', () => {
    return cy.request('POST', "/open/sites/authenticate", {
        "auth_type": 0,
        //"client_id": Cypress.env('clientInfo').clientId,
        "client_id": 9,
        //"client_secret": Cypress.env('clientInfo').clientSecret,
        "client_secret": "Is4GCasU2F2bGvptfuxMrzzpSNwL6o6c1ykqBOv1",
        "domain": "mercer"
    }).then((response) => {
        const token = response.body.body.access_token;
        return cy.wrap(token);
    });

});
Cypress.Commands.add('PostPublic', (url, token, body, options = {}) => {
    cy.request({
        method: 'POST',
        url,
        body,
        headers: { Authorization: `Bearer ${token}` },
        ...options
    });
});

