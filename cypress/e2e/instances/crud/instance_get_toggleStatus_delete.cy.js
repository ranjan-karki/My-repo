import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Instance Get, Status Toggle and Delete Tests', () => {
    const { main: site_id, secondary: another_site, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    const displayLogoTrue   = true;
    const validLayout       = THEMES.theme1;
    let title;
    let message;
    let slug;
    let instanceId;

    before(() => {
        cy.loginAndGetToken();
        title   = `Instance ${randomAlphaNumeric(5)}`;
        message = getRandomSubstring(50);
        slug    = randomAlphaNumeric(8).toLowerCase();
        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            title, message, primaryColor, secondaryColor, displayLogoTrue, validLayout, slug
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // ─── Get Instance List ────────────────────────────────────────────────────

    describe('Get Instance List', () => {
        it('should return instance list with 200 status', () => {
            cy.GetItems(`/sites/${site_id}/instances`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should include the newly created instance in the list with matching input fields', () => {
            const findInstanceAcrossPages = (page) => {
                cy.GetItems(`/sites/${site_id}/instances?page=${page}`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    const body      = response.body.body;
                    const instances = Array.isArray(body) ? body : (body.data ?? []);
                    const lastPage  = body.last_page ?? 1;
                    const found     = instances.find(inst => inst.id === instanceId);
                    if (found) {
                        expect(found.title).to.eq(title);
                        expect(found).to.have.property('status');
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    } else {
                        expect(page, `Instance ${instanceId} not found after checking page ${page} of ${lastPage}`).to.be.lessThan(lastPage);
                        findInstanceAcrossPages(page + 1);
                    }
                });
            };
            findInstanceAcrossPages(1);
        });
    });

    // ─── Get Instance Details ─────────────────────────────────────────────────

    describe('Get Instance Details', () => {
        it('should return instance details with all submitted input fields matching', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const body = response.body.body;
                expect(body.id).to.eq(instanceId);
                expect(body.title).to.eq(title);
                expect(body.slug).to.eq(slug);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for non-existent instance id', () => {
            cy.GetItems(`/sites/${site_id}/instances/999999`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for string id in path parameter', () => {
            cy.GetItems(`/sites/${site_id}/instances/invalid-id`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for negative id in path parameter', () => {
            cy.GetItems(`/sites/${site_id}/instances/-1`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for zero as id in path parameter', () => {
            cy.GetItems(`/sites/${site_id}/instances/0`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
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

        it('should return 404 when trying to get instance details using another reseller site', () => {
            cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        describe('Security - ID Path Parameter', () => {
            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for GET instance details with security payload as instance_id - ${key}`, () => {
                    cy.GetItems(`/sites/${site_id}/instances/${encodeURIComponent(securityPayloads[key])}`, { failOnStatusCode: false }).then((response) => {
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
            it('should return 404 for non-existent instance_id', () => {
                cy.Put(`/sites/${site_id}/instances/999999/status`, {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for invalid (non-numeric) instance_id', () => {
                cy.Put(`/sites/${site_id}/instances/invalid_id/status`, {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent site_id', () => {
                cy.Put(`/sites/999999/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for deleted site_id', () => {
                cy.Put(`/sites/${deleted_site}/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.Put(`/sites/${another_reseller_site}/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for invalid (non-numeric) site_id', () => {
                cy.Put(`/sites/invalid_site_id/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        describe('Security - ID Path Parameter', () => {
            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for status toggle with security payload as instance_id - ${key}`, () => {
                    cy.Put(`/sites/${site_id}/instances/${encodeURIComponent(securityPayloads[key])}/status`, {}, { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for status toggle with security payload as site_id - ${key}`, () => {
                    cy.Put(`/sites/${encodeURIComponent(securityPayloads[key])}/instances/${instanceId}/status`, {}, { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });
    });

    // ─── Delete Instance ──────────────────────────────────────────────────────

    describe('Delete Instance', () => {
        it('should return 404 when trying to delete a non-existent instance', () => {
            cy.Delete(`/sites/${site_id}/instances/999999`, { failOnStatusCode: false }).then((response) => {
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

        describe('Security - ID Path Parameter', () => {
            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for delete with security payload as instance_id - ${key}`, () => {
                    cy.Delete(`/sites/${site_id}/instances/${encodeURIComponent(securityPayloads[key])}`, { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
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

        it('should return 404 when trying to delete the already-deleted instance', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });
});
