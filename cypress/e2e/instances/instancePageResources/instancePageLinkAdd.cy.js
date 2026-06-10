import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { InputBody } from "../../../support/inputBody";
import { SITES, THEMES, TIMEOUTS, LINK_IDs } from "../../../support/testConfig";

describe('Add Instance Page Link Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedLinkId, unpublished: unpublishedLinkId, secondarSiteLink: secondarySiteLinkId, AnotherResellerLink: anotherResellerLinkId } = LINK_IDs;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout       = THEMES.theme1;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    const displayLogoTrue   = true;
    const Order             = 1;

    let instanceId;
    let pageId;
    let anotherInstancePageId;
    let anotherSiteInstanceId;
    let link_ids = [];
    let sharedLinkId;

    before(() => {
        cy.loginAndGetToken();

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: `Page ${randomAlphaNumeric(5)}`, status: true }, { failOnStatusCode: false }
            ).then((pageResponse) => { expect(pageResponse.status).to.eq(200); pageId = pageResponse.body.body.id; });
        });

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            const otherInstanceId = response.body.body.id;
            cy.Post(`/sites/${site_id}/instances/${otherInstanceId}/pages`,
                { title: `Other Page ${randomAlphaNumeric(5)}`, status: true }, { failOnStatusCode: false }
            ).then((pageResponse) => { expect(pageResponse.status).to.eq(200); anotherInstancePageId = pageResponse.body.body.id; });
        });

        cy.GetItems(`/sites/${another_reseller_site}/instances`, { failOnStatusCode: false }).then((response) => {
            if (response.status === 200 && response.body.body.length > 0) anotherSiteInstanceId = response.body.body[0].id;
        });

        cy.GetItems(`/v2/sites/${site_id}/available-links`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            link_ids    = response.body.body.data.map(l => l.id);
            sharedLinkId = link_ids[0];
        });
    });

    beforeEach(() => { cy.loginAndGetToken(); });

    // Detach the shared link after each test so it returns to the available
    // pool and can be reused by the next test (avoids running out of links).
    afterEach(() => {
        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
            { failOnStatusCode: false });
    });

    describe('Order Field - Valid', () => {
        it('should attach link with valid order value', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                { order: 5 }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.id).to.eq(sharedLinkId);
                expect(response.body.status.code).to.eq('ok');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should attach link with order as 1', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach link with order as 0', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                { order: 0 }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach link with order as large positive integer (999)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                { order: 999 }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

    });

    describe('Order Field - Invalid', () => {
        it('should reject order as empty value', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                { order: '' }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                { order: null }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                { order: 'first' }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as negative integer (-1)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                { order: -1 }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderMinZero);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as decimal (1.5)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                { order: 1.5 }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in order input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                    { order: securityPayloads[key] }, { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(417); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });

    describe('URL Param - Site', () => {
        it('should return 404 for non-existent site_id', () => {
            cy.Post(`/sites/999999/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for deleted site_id', () => {
            cy.Post(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for another reseller site_id', () => {
            cy.Post(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for site_id as string type', () => {
            cy.Post(`/sites/invalid_site/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Instance', () => {
        it('should return 404 for non-existent instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/999999/pages/${pageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for instance_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/invalid_id/pages/${pageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Page', () => {
        it('should return 404 for non-existent page_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/999999/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id belonging to another instance', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/invalid_page/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Link', () => {
        it('should attach link with valid link_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for non-existent link_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/999999`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for link_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/invalid_link`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for link_id as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/-1`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for deleted link_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${deletedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for unpublished link_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${unpublishedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for link_id belonging to a secondary site', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${secondarySiteLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for link_id belonging to another reseller', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${anotherResellerLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Security', () => {
        it('should return 404 for site_id as XSS payload', () => {
            cy.Post(`/sites/${encodeURIComponent(securityPayloads.xss)}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id as directory traversal', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads.pathTraversal)}/links/${sharedLinkId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('Duplicate and Conflict', () => {
        it('should not duplicate link in list when attaching same link twice to the same page', () => {
            const linkId = sharedLinkId;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { order: Order }, { failOnStatusCode: false })
                .then((firstResponse) => {
                    expect(firstResponse.status).to.eq(200);
                    cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { order: Order }, { failOnStatusCode: false })
                        .then((response) => {
                            expect(response.status).to.eq(200);
                            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links`, { failOnStatusCode: false })
                                .then((getResponse) => {
                                    expect(getResponse.status).to.eq(200);
                                    const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data || []);
                                    expect(list.filter(l => l.id === linkId)).to.have.length(1);
                                    expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                                });
                        });
                });
        });
    });

    describe('Edge Cases', () => {
        it('should return 417 for empty JSON payload', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, {}, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach link and ignore extra/unexpected fields', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { order: Order, extra: 'ignored' }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for GET request to POST endpoint', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for PUT request to POST endpoint', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should detach an attached link on DELETE request', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((postResponse) => {
                    expect(postResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { failOnStatusCode: false })
                        .then((r) => {
                            expect(r.status).to.eq(200);
                            expect(r.body.body).to.eq(true);
                            expect(r.duration).to.be.lessThan(responseTimeLimit);
                        });
                });
        });

        it('should return 404 for DELETE when link is not attached', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { failOnStatusCode: false })
                .then((r) => {
                    expect(r.status).to.eq(404);
                    expect(r.body.status.message).to.eq(messages.notFound);
                    expect(r.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    describe('Response Validation', () => {
        it('should return correct response body structure on successful POST', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { order: Order }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.body).to.be.an('object');
                    expect(response.body.body.id).to.eq(sharedLinkId);
                    expect(response.body.status.code).to.eq('ok');
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should verify link appears in GET list after successful POST', () => {
            const linkId = sharedLinkId;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { order: 2 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links`, { failOnStatusCode: false })
                        .then((getResponse) => {
                            expect(getResponse.status).to.eq(200);
                            const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data || []);
                            expect(list.find(l => l.id === linkId)).to.exist;
                            expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                        });
                });
        });
    });
});
