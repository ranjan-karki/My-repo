import { messages } from "../../../support/messages";
import { InputBody } from "../../../support/inputBody";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS, DOUMENT_IDs } from "../../../support/testConfig";

describe('Instance Page Document Order Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedDocumentId, unpublish: unpublishedDocumentId, secondarSitedocument: secondarySiteDocumentId, AnotherResellerDocument: anotherResellerDocumentId } = DOUMENT_IDs;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout       = THEMES.theme1;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    const displayLogoTrue   = true;

    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

    let instanceId;
    let pageId;
    let anotherInstancePageId;
    let documents = [];

    const orderEndpoint  = () => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/order`;
    const listEndpoint   = () => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents`;
    const assignEndpoint = (id) => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/documents/${id}`;

    const assignAllDocuments = () => {
        documents.forEach((d, i) => {
            cy.Post(assignEndpoint(d.id), { order: i + 1 }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(200); });
        });
    };

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
            documents = response.body.body.data.map(d => ({ id: d.id }));
        });
    });

    beforeEach(() => { cy.loginAndGetToken(); assignAllDocuments(); });

    // The GET list, filtered to the ids we sent, should come back in exactly the
    // sequence those ids were sent in.
    const expectListInOrder = (getResponse, ids) => {
        expect(getResponse.status).to.eq(200);
        const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data ?? []);
        const returned = list.map(d => d.id).filter(id => ids.includes(id));
        expect(returned).to.deep.eq(ids);
    };

    describe('Positive Scenarios', () => {
        it('should reorder documents with shuffled ids and GET returns them in that sequence', () => {
            const ids = shuffle(documents.map(d => d.id));
            cy.Put(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.GetItems(listEndpoint(), { failOnStatusCode: false }).then((getResponse) => {
                    expectListInOrder(getResponse, ids);
                    expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should reorder documents to reverse sequence and GET returns the reversed order', () => {
            const ids = documents.map(d => d.id).reverse();
            cy.Put(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.GetItems(listEndpoint(), { failOnStatusCode: false }).then((getResponse) => {
                    expectListInOrder(getResponse, ids);
                });
            });
        });

        it('should reorder with a single id in the array', () => {
            cy.Put(orderEndpoint(), { ids: [documents[0].id] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should be idempotent when same id order is sent twice', () => {
            const ids = shuffle(documents.map(d => d.id));
            cy.Put(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((first) => {
                expect(first.status).to.eq(200);
                cy.Put(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((second) => {
                    expect(second.status).to.eq(200);
                    expect(second.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Body Validations', () => {
        it('should return 417 for empty JSON payload', () => {
            cy.Put(orderEndpoint(), {}, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids key is missing', () => {
            cy.Put(orderEndpoint(), { items: [] }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids is a non-array string', () => {
            cy.Put(orderEndpoint(), { ids: 'invalid' }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids is an integer', () => {
            cy.Put(orderEndpoint(), { ids: 123 }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids contains a non-numeric value', () => {
            cy.Put(orderEndpoint(), { ids: ['invalid'] }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids contains a decimal value', () => {
            cy.Put(orderEndpoint(), { ids: [1.5] }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids contains a null value', () => {
            cy.Put(orderEndpoint(), { ids: [null] }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 or 422 when ids contains duplicate ids', () => {
            cy.Put(orderEndpoint(), { ids: [documents[0].id, documents[0].id] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.be.oneOf([417, 422]); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains a deleted document id', () => {
            cy.Put(orderEndpoint(), { ids: [deletedDocumentId] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains an unpublished document id', () => {
            cy.Put(orderEndpoint(), { ids: [unpublishedDocumentId] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains a secondary-site document id', () => {
            cy.Put(orderEndpoint(), { ids: [secondarySiteDocumentId] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains another reseller document id', () => {
            cy.Put(orderEndpoint(), { ids: [anotherResellerDocumentId] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Path Verifications', () => {
        const validIds = () => documents.map(d => d.id);

        it('should return 404 for non-existent site_id', () => {
            cy.Put(`/sites/999999/instances/${instanceId}/pages/${pageId}/documents/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for deleted site_id', () => {
            cy.Put(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/documents/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for another reseller site_id', () => {
            cy.Put(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/documents/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for non-existent instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/999999/pages/${pageId}/documents/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for non-existent page_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/999999/documents/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id belonging to another instance', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/documents/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('Security - URL Path Parameter', () => {
        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 for security payload as site_id - ${key}`, () => {
                cy.Put(`/sites/${encodeURIComponent(securityPayloads[key])}/instances/${instanceId}/pages/${pageId}/documents/order`, { ids: [] }, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 for security payload as page_id - ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads[key])}/documents/order`, { ids: [] }, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });

    describe('HTTP Method Validation', () => {
        it('should return 405 for GET request to /order endpoint', () => {
            cy.GetItems(orderEndpoint(), { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for POST request to /order endpoint', () => {
            cy.Post(orderEndpoint(), { ids: documents.map(d => d.id) }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for DELETE request to /order endpoint', () => {
            cy.Delete(orderEndpoint(), { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });
});
