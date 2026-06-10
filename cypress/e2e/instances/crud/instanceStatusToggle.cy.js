import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Instance Status Toggle Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    let validLayout = THEMES.theme2;

    const displayLogoTrue   = true;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    let instanceId;

    before(() => {
        cy.loginAndGetToken();
        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(5).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    describe('Positive Scenarios', () => {
        it('should toggle instance status from draft (0) to live (1)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.status).to.eq(1);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should toggle instance status back to draft (0) after being live (1)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.status).to.eq(0);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Invalid ID Verifications', () => {
        it('should reject non-existent instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/999999/status`, {}, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject invalid (non-numeric) instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/invalid_id/status`, {}, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject non-existent site_id', () => {
            cy.Put(`/sites/999999/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject deleted site_id', () => {
            cy.Put(`/sites/${deleted_site}/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject another reseller site_id', () => {
            cy.Put(`/sites/${another_reseller_site}/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject invalid (non-numeric) site_id', () => {
            cy.Put(`/sites/invalid_site_id/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });
});
