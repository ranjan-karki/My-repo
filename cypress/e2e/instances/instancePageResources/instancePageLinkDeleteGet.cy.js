import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { InputBody } from "../../../support/inputBody";
import { SITES, THEMES, TIMEOUTS, LINK_IDs } from "../../../support/testConfig";

describe('Delete and Get Instance Page Link Tests', () => {
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
    let links      = [];
    let sharedLinkId;
    let linkIndex  = 0;

    const getNextLink = () => links[linkIndex++];

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

        cy.GetItems(`/v2/sites/${site_id}/available-links`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            links        = response.body.body.data.map(l => ({ id: l.id }));
            sharedLinkId = links[0].id;
        });
    });

    beforeEach(() => { cy.loginAndGetToken(); });

    describe('DELETE - Detach Link from Page', () => {
        describe('Positive Scenarios', () => {
            it('should detach link successfully', () => {
                const { id: linkId } = getNextLink();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { order: Order }, { failOnStatusCode: false })
                    .then((addResponse) => {
                        expect(addResponse.status).to.eq(200);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { failOnStatusCode: false })
                            .then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
                    });
            });

            it('should confirm link is no longer in list after detach', () => {
                const { id: linkId } = getNextLink();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { order: Order }, { failOnStatusCode: false })
                    .then((addResponse) => {
                        expect(addResponse.status).to.eq(200);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { failOnStatusCode: false })
                            .then((deleteResponse) => {
                                expect(deleteResponse.status).to.eq(200);
                                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links`, { failOnStatusCode: false })
                                    .then((listResponse) => {
                                        expect(listResponse.status).to.eq(200);
                                        const list = Array.isArray(listResponse.body.body) ? listResponse.body.body : (listResponse.body.body.data || []);
                                        expect(list.find(l => l.id === linkId)).to.not.exist;
                                        expect(listResponse.duration).to.be.lessThan(responseTimeLimit);
                                    });
                            });
                    });
            });

            it('should return 404 when trying to detach an already-detached link', () => {
                const { id: linkId } = getNextLink();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { order: Order }, { failOnStatusCode: false })
                    .then((addResponse) => {
                        expect(addResponse.status).to.eq(200);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { failOnStatusCode: false })
                            .then((firstDelete) => {
                                expect(firstDelete.status).to.eq(200);
                                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { failOnStatusCode: false })
                                    .then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
                            });
                    });
            });
        });

        describe('Link ID Verifications', () => {
            it('should return 404 for non-existent link_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/999999`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for link_id as negative integer', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/-1`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for link_id as non-numeric string', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/invalid_id`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for link not attached to this page', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for deleted link_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${deletedLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for unpublished link_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${unpublishedLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for link_id belonging to a secondary site', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${secondarySiteLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for link_id belonging to another reseller', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${anotherResellerLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for link_id as security payload - ${key}`, () => {
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${encodeURIComponent(securityPayloads[key])}`, { failOnStatusCode: false })
                        .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
                });
            });
        });

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.Delete(`/sites/999999/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for deleted site_id', () => {
                cy.Delete(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.Delete(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/links/${sharedLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.Delete(`/sites/${site_id}/instances/999999/pages/${pageId}/links/${sharedLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/999999/links/${sharedLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/links/${sharedLinkId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });

    describe('GET - List Page Links', () => {
        describe('Positive Scenarios', () => {
            it('should return 200 and a list for valid page', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return an array in the response body', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links`, { failOnStatusCode: false })
                    .then((response) => {
                        expect(response.status).to.eq(200);
                        const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                        expect(list).to.be.an('array');
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
            });

            it('should confirm attached link appears in the list', () => {
                const { id: linkId } = getNextLink();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links/${linkId}`, { order: Order }, { failOnStatusCode: false })
                    .then((addResponse) => {
                        expect(addResponse.status).to.eq(200);
                        cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/links`, { failOnStatusCode: false })
                            .then((response) => {
                                expect(response.status).to.eq(200);
                                const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                                expect(list.find(l => l.id === linkId)).to.exist;
                                expect(response.duration).to.be.lessThan(responseTimeLimit);
                            });
                    });
            });
        });

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.GetItems(`/sites/999999/instances/${instanceId}/pages/${pageId}/links`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/999999/pages/${pageId}/links`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/999999/links`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/links`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/links`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });
});
