import { InputBody } from "../../../support/inputBody";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { messages } from "../../../support/messages";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Delete and Get Instance Tests', () => {
    const { main: site_id, secondary: another_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    let validLayout = THEMES.theme1;

    const displayLogoTrue   = true;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    let instanceId;
    let instanceTitle;

    before(() => {
        cy.loginAndGetToken();

        instanceTitle = `DeleteTest_${randomAlphaNumeric(5)}`;
        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            instanceTitle, getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    it('should validate currently added instance is in the list', () => {
        cy.GetItems(`/sites/${site_id}/instances`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            const instances = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
            const foundInstance = instances.find(inst => inst.id === instanceId);
            expect(foundInstance).to.exist;
            expect(foundInstance.title).to.eq(instanceTitle);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should get instance details with id attached in the url', () => {
        cy.GetItems(`/sites/${site_id}/instances/${instanceId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.body.id).to.eq(instanceId);
            expect(response.body.body.title).to.eq(instanceTitle);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get instance using another reseller site', () => {
        cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get instance details using another site', () => {
        cy.GetItems(`/sites/${another_site}/instances/${instanceId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to delete instance using another site', () => {
        cy.Delete(`/sites/${another_site}/instances/${instanceId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to delete instance using another reseller site', () => {
        cy.Delete(`/sites/${another_reseller_site}/instances/${instanceId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should delete the instance successfully', () => {
        cy.Delete(`/sites/${site_id}/instances/${instanceId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            if (typeof response.body.body === 'boolean') {
                expect(response.body.body).to.be.true;
            } else if (response.body.body && response.body.body.success !== undefined) {
                expect(response.body.body.success).to.be.true;
            }
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get the deleted instance', () => {
        cy.GetItems(`/sites/${site_id}/instances/${instanceId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });
});
