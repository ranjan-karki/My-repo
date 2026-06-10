import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Get and Delete Instance Page Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;

    const publish = 2;
    const unpublish = 1;
    const langEn = 'en';
    const langEs = 'es';
    const iconHome = 'fas fa-home';
    const Order = 1;

    let instanceId;
    let pageId;
    let pageTitle;
    let childPageId;
    let page2Id;

    before(() => {
        cy.loginAndGetToken();

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), "#123456", "#654321", true, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;

            pageTitle = `TestPage_${randomAlphaNumeric(6)}`;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages(pageTitle, 'A test description', publish, iconHome, Order, 'Header', 'Footer', langEn, null, null),
                { failOnStatusCode: false }
            ).then((pageResponse) => {
                expect(pageResponse.status).to.eq(200);
                pageId = pageResponse.body.body.id;

                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                    InputBody.instancePages(`Child_${randomAlphaNumeric(5)}`, null, publish, null, 2, null, null, null, null, pageId),
                    { failOnStatusCode: false }
                ).then((childResponse) => {
                    expect(childResponse.status).to.eq(200);
                    childPageId = childResponse.body.body.id;
                });
            });

            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages(`SecondPage_${randomAlphaNumeric(5)}`, null, unpublish, null, 3, null, null, langEs, null, null),
                { failOnStatusCode: false }
            ).then((p2Response) => {
                expect(p2Response.status).to.eq(200);
                page2Id = p2Response.body.body.id;
            });
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // ─── GET List ────────────────────────────────────────────────────────────

    describe('GET List', () => {
        it('should return 200 and list of pages for valid instance', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                const pages = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                expect(pages).to.be.an('array');
            });
        });

        it('should confirm created page appears in the list', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const pages = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                const found = pages.find(p => p.id === pageId);
                expect(found).to.exist;
                expect(found.title).to.eq(pageTitle);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should confirm list contains both active and inactive pages', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const pages = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                const activePage = pages.find(p => p.id === pageId);
                const inactivePage = pages.find(p => p.id === page2Id);
                expect(activePage).to.exist;
                expect(inactivePage).to.exist;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should confirm child page appears in list with correct related_id', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const pages = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                const child = pages.find(p => p.id === childPageId);
                expect(child).to.exist;
                expect(child.related_id).to.eq(pageId);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for GET list with non-existent site_id', () => {
            cy.GetItems(`/sites/999999/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for GET list with deleted site_id', () => {
            cy.GetItems(`/sites/${deleted_site}/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for GET list with another reseller site_id', () => {
            cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for GET list with non-numeric site_id', () => {
            cy.GetItems(`/sites/invalid_site/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for GET list with non-existent instance_id', () => {
            cy.GetItems(`/sites/${site_id}/instances/999999/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for GET list with non-numeric instance_id', () => {
            cy.GetItems(`/sites/${site_id}/instances/invalid_instance/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for GET list with negative instance_id', () => {
            cy.GetItems(`/sites/${site_id}/instances/-1/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── GET Single ──────────────────────────────────────────────────────────

    describe('GET Single', () => {
        it('should get page details by id', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.id).to.eq(pageId);
                expect(response.body.body.title).to.eq(pageTitle);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should verify all expected fields are present in single page response', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const body = response.body.body;
                expect(body).to.have.property('id');
                expect(body).to.have.property('title');
                expect(body).to.have.property('description');
                expect(body).to.have.property('status');
                expect(body).to.have.property('icon');
                expect(body).to.have.property('order');
                expect(body).to.have.property('header');
                expect(body).to.have.property('footer');
                expect(body).to.have.property('lang');
                expect(body).to.have.property('thumbnail_url');
                expect(body).to.have.property('related_id');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should verify correct field values in single page response', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const body = response.body.body;
                expect(body.title).to.eq(pageTitle);
                expect(body.description).to.eq('A test description');
                expect(body.status).to.eq(publish);
                expect(body.icon).to.eq('fas fa-home');
                expect(body.lang).to.eq('en');
                expect(body.header).to.eq('Header');
                expect(body.footer).to.eq('Footer');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should get child page and verify related_id points to parent', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${childPageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.related_id).to.eq(pageId);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for non-existent page_id', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/999999`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for page_id as 0', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/0`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for page_id as negative integer', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/-1`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for non-numeric page_id', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/invalid_id`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when using another reseller site_id', () => {
            cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when using deleted site_id', () => {
            cy.GetItems(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when using non-existent site_id', () => {
            cy.GetItems(`/sites/999999/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when using non-numeric site_id', () => {
            cy.GetItems(`/sites/invalid_site/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when using non-existent instance_id', () => {
            cy.GetItems(`/sites/${site_id}/instances/999999/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when using non-numeric instance_id', () => {
            cy.GetItems(`/sites/${site_id}/instances/invalid_instance/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 for page_id as security payload - ${key}`, () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads[key])}`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── GET Path Traversal Validations ─────────────────────────────────────

    describe('GET Path Traversal Validations', () => {
        it('should reject path traversal in site_id on GET single', () => {
            cy.GetItems(`/sites/${encodeURIComponent('../../etc/passwd')}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject URL-encoded path traversal in site_id (%2e%2e%2f)', () => {
            cy.GetItems(`/sites/%2e%2e%2f/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal in instance_id on GET single', () => {
            cy.GetItems(`/sites/${site_id}/instances/${encodeURIComponent('../../etc/passwd')}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal in page_id on GET single', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent('../../etc/passwd')}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal in instance_id on GET list', () => {
            cy.GetItems(`/sites/${site_id}/instances/${encodeURIComponent('../../etc/passwd')}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal security payload in site_id on GET list', () => {
            cy.GetItems(`/sites/${encodeURIComponent(securityPayloads.pathTraversal)}/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── DELETE Validations (negative — page remains intact) ─────────────────

    describe('DELETE Validations', () => {
        it('should return 404 when deleting with non-existent page_id', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/999999`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting with page_id as 0', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/0`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting with negative page_id', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/-1`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting with non-numeric page_id', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/invalid_id`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting with non-existent site_id', () => {
            cy.Delete(`/sites/999999/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting with deleted site_id', () => {
            cy.Delete(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting with another reseller site_id', () => {
            cy.Delete(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting with non-numeric site_id', () => {
            cy.Delete(`/sites/invalid_site/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting with non-existent instance_id', () => {
            cy.Delete(`/sites/${site_id}/instances/999999/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting with non-numeric instance_id', () => {
            cy.Delete(`/sites/${site_id}/instances/invalid_instance/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 when deleting with page_id as security payload - ${key}`, () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads[key])}`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── DELETE Path Traversal Validations ──────────────────────────────────

    describe('DELETE Path Traversal Validations', () => {
        it('should reject path traversal in site_id on DELETE', () => {
            cy.Delete(`/sites/${encodeURIComponent('../../etc/passwd')}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject URL-encoded path traversal in site_id on DELETE (%2e%2e%2f)', () => {
            cy.Delete(`/sites/%2e%2e%2f/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal in instance_id on DELETE', () => {
            cy.Delete(`/sites/${site_id}/instances/${encodeURIComponent('../../etc/passwd')}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal in page_id on DELETE', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent('../../etc/passwd')}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal security payload in page_id on DELETE', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads.pathTraversal)}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── DELETE & Verify (runs last — modifies state) ────────────────────────

    describe('DELETE and Verify', () => {
        it('should delete child page successfully', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${childPageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when getting the deleted child page', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${childPageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting already deleted child page', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${childPageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should confirm deleted child page is no longer in the list', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const pages = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                const found = pages.find(p => p.id === childPageId);
                expect(found).to.not.exist;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should delete the parent page successfully', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                if (typeof response.body.body === 'boolean') {
                    expect(response.body.body).to.be.true;
                } else if (response.body.body && response.body.body.success !== undefined) {
                    expect(response.body.body.success).to.be.true;
                }
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when getting the deleted parent page', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when deleting already deleted parent page', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should confirm deleted parent page is no longer in the list', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                const pages = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                const found = pages.find(p => p.id === pageId);
                expect(found).to.not.exist;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });
});
