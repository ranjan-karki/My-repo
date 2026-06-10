import { InputBody } from "../../support/inputBody";
import { messages } from "../../support/messages";
import { randomAlphaNumeric } from "../../utils/basicUtils";
import { securityPayloads } from "../../utils/securityPayloads";
import { SITES, TIMEOUTS } from "../../support/testConfig";
import { fileUrls } from "../../fixtures/fileUrls";

describe('Site Get, Status Toggle and Delete Tests', () => {
    const responseTimeLimit                        = TIMEOUTS.response;
    const validLogoUrl                             = fileUrls.png;
    const validPrimary                             = '#123456';
    const validSecondary                           = '#654321';
    const { resellerSite: another_reseller_site }  = SITES;
    let title;
    let domain;
    let siteId;

    before(() => {
        cy.loginAndGetToken();
        title  = `Site ${randomAlphaNumeric(5)}`;
        domain = randomAlphaNumeric(8).toLowerCase();
        cy.Post('/sites',
            InputBody.sites(title, domain, validLogoUrl, validPrimary, validSecondary, null),
            { failOnStatusCode: false }
        ).then((response) => {
            expect(response.status).to.eq(200);
            siteId = response.body.body.id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // ─── Get Site List ────────────────────────────────────────────────────────

    describe('Get Site List', () => {
        it('should return site list with 200 status', () => {
            cy.GetItems('/sites', { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should include the newly created site in the list with matching input fields', () => {
            const findSiteAcrossPages = (page) => {
                cy.GetItems(`/sites?page=${page}`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    const body     = response.body.body;
                    const sites    = Array.isArray(body) ? body : (body.data ?? []);
                    const lastPage = body.last_page ?? 1;
                    const found    = sites.find(s => s.id === siteId);
                    if (found) {
                        expect(found.title).to.eq(title);
                        expect(found.domain).to.eq(domain);
                        expect(found).to.have.property('logo_url');
                        expect(found).to.have.property('default_instance_id');
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    } else {
                        expect(page, `Site ${siteId} not found after checking page ${page} of ${lastPage}`).to.be.lessThan(lastPage);
                        findSiteAcrossPages(page + 1);
                    }
                });
            };
            findSiteAcrossPages(1);
        });

        it('should verify each site in the list contains default_instance_id property', () => {
            cy.GetItems('/sites', { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const sites = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data ?? []);
                expect(sites.length).to.be.greaterThan(0);
                sites.forEach(site => {
                    expect(site).to.have.property('default_instance_id');
                });
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Get Site Details ─────────────────────────────────────────────────────

    describe('Get Site Details', () => {
        it('should return site details with all submitted input fields matching', () => {
            cy.GetItems(`/sites/${siteId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const body = response.body.body;
                expect(body.id).to.eq(siteId);
                expect(body.title).to.eq(title);
                expect(body.domain).to.eq(domain);
                expect(body.primary_color).to.eq(validPrimary);
                expect(body.secondary_color).to.eq(validSecondary);
                expect(body).to.have.property('logo_url');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should verify site details response contains default_instance_id as a number', () => {
            cy.GetItems(`/sites/${siteId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const body = response.body.body;
                expect(body).to.have.property('default_instance_id');
                expect(body.default_instance_id).to.be.a('number');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for non-existent site id in path parameter', () => {
            cy.GetItems('/sites/999999', { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for string id in path parameter', () => {
            cy.GetItems('/sites/invalid-id', { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for negative id in path parameter', () => {
            cy.GetItems('/sites/-1', { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for zero as id in path parameter', () => {
            cy.GetItems('/sites/0', { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when trying to get site details of another reseller site', () => {
            cy.GetItems(`/sites/${another_reseller_site}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        describe('Security - ID Path Parameter', () => {
            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for GET site details with security payload as id - ${key}`, () => {
                    cy.GetItems(`/sites/${encodeURIComponent(securityPayloads[key])}`, { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });
    });

    // ─── Status Toggle ────────────────────────────────────────────────────────

    describe('Status Toggle', () => {
        describe('Positive Scenarios', () => {
            it('should toggle site status on first call', () => {
                cy.Put(`/sites/${siteId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.body.status).to.be.oneOf([1, 2]);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should toggle site status back on second call', () => {
                cy.Put(`/sites/${siteId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.body.status).to.be.oneOf([1, 2]);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        describe('Invalid ID Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.Put('/sites/999999/status', {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for invalid (non-numeric) site_id', () => {
                cy.Put('/sites/invalid_id/status', {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for negative site_id', () => {
                cy.Put('/sites/-1/status', {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for zero as site_id', () => {
                cy.Put('/sites/0/status', {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        describe('Security - ID Path Parameter', () => {
            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for status toggle with security payload as site_id - ${key}`, () => {
                    cy.Put(`/sites/${encodeURIComponent(securityPayloads[key])}/status`, {}, { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });
    });

    // ─── Delete Site ──────────────────────────────────────────────────────────

    describe('Delete Site', () => {
        it('should return 404 when trying to delete a non-existent site', () => {
            cy.Delete('/sites/999999', { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when trying to delete a site with invalid id', () => {
            cy.Delete('/sites/invalid-id', { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        describe('Security - ID Path Parameter', () => {
            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for delete with security payload as site_id - ${key}`, () => {
                    cy.Delete(`/sites/${encodeURIComponent(securityPayloads[key])}`, { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

        it('should delete the site successfully', () => {
            cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                if (typeof response.body.body === 'boolean') {
                    expect(response.body.body).to.be.true;
                } else if (response.body.body && response.body.body.success !== undefined) {
                    expect(response.body.body.success).to.be.true;
                }
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when trying to get the deleted site', () => {
            cy.GetItems(`/sites/${siteId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when trying to delete the already-deleted site', () => {
            cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });
});
