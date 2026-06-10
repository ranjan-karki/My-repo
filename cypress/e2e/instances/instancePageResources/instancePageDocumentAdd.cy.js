import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { InputBody } from "../../../support/inputBody";
import { SITES, THEMES, TIMEOUTS, DOUMENT_IDs } from "../../../support/testConfig";

describe('Add Instance Page Document Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedDocumentId, unpublish: unpublishedDocumentId, secondarSitedocument: secondarySiteDocumentId, AnotherResellerDocument: anotherResellerDocumentId } = DOUMENT_IDs;
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
    let document_ids = [];
    let sharedDocumentId;
    let documentIdIndex = 1;

    const getNextDocumentId = () => document_ids[documentIdIndex++];

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

        cy.GetItems(`/v2/sites/${site_id}/available-documents`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            document_ids    = response.body.body.data.map(d => d.id);
            sharedDocumentId = document_ids[0];
        });
    });

    beforeEach(() => { cy.loginAndGetToken(); });

    describe('Order Field - Valid', () => {
        it('should attach document with valid order value', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${getNextDocumentId()}`,
                { order: 5 }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body).to.eq(true);
                expect(response.body.status.code).to.eq('ok');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should attach document with order as 1', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${getNextDocumentId()}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach document with order as 0', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${getNextDocumentId()}`,
                { order: 0 }, { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach document with order as large positive integer (999)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${getNextDocumentId()}`,
                { order: 999 }, { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach document with order as negative integer (-1)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${getNextDocumentId()}`,
                { order: -1 }, { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('Order Field - Invalid', () => {
        it('should reject order as empty value', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`,
                { order: '' }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`,
                { order: null }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`,
                { order: 'first' }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as decimal (1.5)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`,
                { order: 1.5 }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as boolean', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`,
                { order: true }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in order input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`,
                    { order: securityPayloads[key] }, { failOnStatusCode: false }
                ).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });

    describe('URL Param - Site', () => {
        it('should return 404 for non-existent site_id', () => {
            cy.Post(`/sites/999999/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for deleted site_id', () => {
            cy.Post(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for another reseller site_id', () => {
            cy.Post(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for site_id as string type', () => {
            cy.Post(`/sites/invalid_site/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Instance', () => {
        it('should return 404 for non-existent instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/999999/pages/${pageId}/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for instance_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/invalid_id/pages/${pageId}/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Page', () => {
        it('should return 404 for non-existent page_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/999999/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id belonging to another instance', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/invalid_page/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Document', () => {
        it('should attach document with valid document_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${getNextDocumentId()}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for non-existent document_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/999999`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for document_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/invalid_doc`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for document_id as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/-1`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for deleted document_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${deletedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for unpublished document_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${unpublishedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for document_id belonging to a secondary site', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${secondarySiteDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for document_id belonging to another reseller', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${anotherResellerDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Security', () => {
        it('should return 404 for site_id as XSS payload', () => {
            cy.Post(`/sites/${encodeURIComponent(securityPayloads.xss)}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id as directory traversal', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads.pathTraversal)}/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('Duplicate and Conflict', () => {
        it('should return 409 when attaching same document twice to the same page', () => {
            const documentId = getNextDocumentId();
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { order: Order }, { failOnStatusCode: false })
                .then((firstResponse) => {
                    expect(firstResponse.status).to.eq(200);
                    cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { order: Order }, { failOnStatusCode: false })
                        .then((response) => { expect(response.status).to.eq(409); expect(response.duration).to.be.lessThan(responseTimeLimit); });
                });
        });
    });

    describe('Edge Cases', () => {
        it('should return 417 for empty JSON payload', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, {}, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach document and ignore extra/unexpected fields', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${getNextDocumentId()}`, { order: Order, extra: 'ignored' }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for GET request to POST endpoint', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for PUT request to POST endpoint', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { order: Order }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for DELETE request to POST endpoint', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('Response Validation', () => {
        it('should return correct response body structure on successful POST', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${getNextDocumentId()}`, { order: Order }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.body).to.eq(true);
                    expect(response.body.status.code).to.eq('ok');
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should verify document appears in GET list after successful POST', () => {
            const documentId = getNextDocumentId();
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { order: 2 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents`, { failOnStatusCode: false })
                        .then((getResponse) => {
                            expect(getResponse.status).to.eq(200);
                            const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data || []);
                            expect(list.find(d => d.id === documentId)).to.exist;
                            expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                        });
                });
        });
    });
});
