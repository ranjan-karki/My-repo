import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Homepage Message Tests', () => {
    const { main: site_id } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const primaryLayout     = THEMES.theme2;

    const primaryColor   = '#123456';
    const secondaryColor = '#654321';
    let title              = randomAlphaNumeric(5);
    let message            =getRandomSubstring(50);
    let instanceId;
    let slug = randomAlphaNumeric(8).toLowerCase();

    before(() => {
        cy.loginAndGetToken();
        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            title, message, primaryColor, secondaryColor, true, primaryLayout, slug
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // ─── Positive Scenarios ───────────────────────────────────────────────────

    describe('Positive Scenarios', () => {
        it('should update message with valid text', () => {
            message = randomAlphaNumeric(50);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update message with single character', () => {
            message = randomAlphaNumeric(1);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update message with large text (500 chars)', () => {
            message = randomAlphaNumeric(500);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update message with newlines', () => {
            message = 'Line one\nLine two\nLine three';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update message with unicode characters', () => {
            message = 'Welcome! 欢迎 Bienvenue مرحبا';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update message with special characters', () => {
            message = 'Hello! @world #test $value & more...';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update message with HTML content (sanitized)', () => {
            message = '<p>Welcome to <strong>our site</strong></p>';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update message with numbers only', () => {
            message = '1234567890';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Message Validation ───────────────────────────────────────────────────

    describe('Message Validation', () => {
        it('should reject empty message', () => {
            message = '';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.message[0]).to.eq(messages.messageRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject null message', () => {
            message = null;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.message[0]).to.eq(messages.messageRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject message as integer type', () => {
            message = 12345;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject message as boolean type', () => {
            message = true;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject whitespace-only message', () => {
            message = '   ';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.message[0]).to.eq(messages.messageRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Large Input (no size limit on message) ───────────────────────────────

    describe('Large Input', () => {
        it('should accept message as 10,000 characters', () => {
            message = 'a'.repeat(10_000);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept message as 100,000 characters', () => {
            message = 'a'.repeat(100_000);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept message as 1MB string', () => {
            message = 'a'.repeat(1024 * 1024);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Security Verifications ───────────────────────────────────────────────

    describe('Security Verifications', () => {
        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security payload in message - ${key}`, () => {
                message = securityPayloads[key];
                cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.not.eq(500);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });
});
