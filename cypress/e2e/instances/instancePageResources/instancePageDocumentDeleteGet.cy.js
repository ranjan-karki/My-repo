import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { InputBody } from "../../../support/inputBody";
import { SITES, THEMES, TIMEOUTS, DOUMENT_IDs } from "../../../support/testConfig";

describe('Delete and Get Instance Page Document Tests', () => {
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
    let documents     = [];
    let sharedDocumentId;
    let documentIndex = 0;

    const getNextDocument = () => documents[documentIndex++];

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

        cy.GetItems(`/v2/sites/${site_id}/available-documents`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            documents        = response.body.body.data.map(d => ({ id: d.id }));
            sharedDocumentId = documents[0].id;
        });
    });

    beforeEach(() => { cy.loginAndGetToken(); });

    describe('DELETE - Detach Document from Page', () => {
        describe('Positive Scenarios', () => {
            it('should detach document successfully', () => {
                const { id: documentId } = getNextDocument();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { order: Order }, { failOnStatusCode: false })
                    .then((addResponse) => {
                        expect(addResponse.status).to.eq(200);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { failOnStatusCode: false })
                            .then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
                    });
            });

            it('should confirm document is no longer in list after detach', () => {
                const { id: documentId } = getNextDocument();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { order: Order }, { failOnStatusCode: false })
                    .then((addResponse) => {
                        expect(addResponse.status).to.eq(200);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { failOnStatusCode: false })
                            .then((deleteResponse) => {
                                expect(deleteResponse.status).to.eq(200);
                                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents`, { failOnStatusCode: false })
                                    .then((listResponse) => {
                                        expect(listResponse.status).to.eq(200);
                                        const list = Array.isArray(listResponse.body.body) ? listResponse.body.body : (listResponse.body.body.data || []);
                                        expect(list.find(d => d.id === documentId)).to.not.exist;
                                        expect(listResponse.duration).to.be.lessThan(responseTimeLimit);
                                    });
                            });
                    });
            });

            it('should return 404 when trying to detach an already-detached document', () => {
                const { id: documentId } = getNextDocument();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { order: Order }, { failOnStatusCode: false })
                    .then((addResponse) => {
                        expect(addResponse.status).to.eq(200);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { failOnStatusCode: false })
                            .then((firstDelete) => {
                                expect(firstDelete.status).to.eq(200);
                                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { failOnStatusCode: false })
                                    .then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
                            });
                    });
            });
        });

        describe('Document ID Verifications', () => {
            it('should return 404 for non-existent document_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/999999`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for document_id as negative integer', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/-1`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for document_id as non-numeric string', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/invalid_id`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for document not attached to this page', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for deleted document_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${deletedDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for unpublished document_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${unpublishedDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for document_id belonging to a secondary site', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${secondarySiteDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for document_id belonging to another reseller', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${anotherResellerDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for document_id as security payload - ${key}`, () => {
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${encodeURIComponent(securityPayloads[key])}`, { failOnStatusCode: false })
                        .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
                });
            });
        });

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.Delete(`/sites/999999/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for deleted site_id', () => {
                cy.Delete(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.Delete(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/documents/${sharedDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.Delete(`/sites/${site_id}/instances/999999/pages/${pageId}/documents/${sharedDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/999999/documents/${sharedDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/documents/${sharedDocumentId}`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });

    describe('GET - List Page Documents', () => {
        describe('Positive Scenarios', () => {
            it('should return 200 and a list for valid page', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return an array in the response body', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents`, { failOnStatusCode: false })
                    .then((response) => {
                        expect(response.status).to.eq(200);
                        const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                        expect(list).to.be.an('array');
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
            });

            it('should confirm attached document appears in the list', () => {
                const { id: documentId } = getNextDocument();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${documentId}`, { order: Order }, { failOnStatusCode: false })
                    .then((addResponse) => {
                        expect(addResponse.status).to.eq(200);
                        cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents`, { failOnStatusCode: false })
                            .then((response) => {
                                expect(response.status).to.eq(200);
                                const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                                expect(list.find(d => d.id === documentId)).to.exist;
                                expect(response.duration).to.be.lessThan(responseTimeLimit);
                            });
                    });
            });
        });

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.GetItems(`/sites/999999/instances/${instanceId}/pages/${pageId}/documents`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/999999/pages/${pageId}/documents`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/999999/documents`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/documents`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/documents`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });
});
