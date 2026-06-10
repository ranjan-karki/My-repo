import { messages } from "../../../support/messages";
import { InputBody } from "../../../support/inputBody";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS, IMAGE_IDs } from "../../../support/testConfig";

describe('Instance Page Image Order Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedImageId, unpublished: unpublishedImageId, secondarSiteImage: secondarySiteImageId, AnotherResellerimage: anotherResellerImageId } = IMAGE_IDs;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout       = THEMES.theme1;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    const displayLogoTrue   = true;

    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

    let instanceId;
    let pageId;
    let anotherInstancePageId;
    let images = [];

    const orderEndpoint  = () => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/order`;
    const listEndpoint   = () => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images`;
    const assignEndpoint = (id) => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${id}`;

    const assignAllImages = () => {
        images.forEach((img, i) => {
            cy.Post(assignEndpoint(img.id), { order: i + 1 }, { failOnStatusCode: false })
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

        cy.GetItems(`/v2/sites/${site_id}/available-images`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            images = response.body.body.data.map(i => ({ id: i.id }));
        });
    });

    beforeEach(() => { cy.loginAndGetToken(); assignAllImages(); });

    // The GET list, filtered to the ids we sent, should come back in exactly the
    // sequence those ids were sent in.
    const expectListInOrder = (getResponse, ids) => {
        expect(getResponse.status).to.eq(200);
        const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data ?? []);
        const returned = list.map(img => img.id).filter(id => ids.includes(id));
        expect(returned).to.deep.eq(ids);
    };

    describe('Positive Scenarios', () => {
        it('should reorder images with shuffled ids and GET returns them in that sequence', () => {
            const ids = shuffle(images.map(img => img.id));
            cy.Put(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.GetItems(listEndpoint(), { failOnStatusCode: false }).then((getResponse) => {
                    expectListInOrder(getResponse, ids);
                    expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should reorder images to reverse sequence and GET returns the reversed order', () => {
            const ids = images.map(img => img.id).reverse();
            cy.Put(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.GetItems(listEndpoint(), { failOnStatusCode: false }).then((getResponse) => {
                    expectListInOrder(getResponse, ids);
                });
            });
        });

        it('should reorder with a single id in the array', () => {
            cy.Put(orderEndpoint(), { ids: [images[0].id] }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should be idempotent when same id order is sent twice', () => {
            const ids = shuffle(images.map(img => img.id));
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
            cy.Put(orderEndpoint(), {}, { failOnStatusCode: false }).then((response) => { expect(response.status).to.eq(417); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids key is missing', () => {
            cy.Put(orderEndpoint(), { items: [] }, { failOnStatusCode: false }).then((response) => { expect(response.status).to.eq(417); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids is a non-array string', () => {
            cy.Put(orderEndpoint(), { ids: 'invalid' }, { failOnStatusCode: false }).then((response) => { expect(response.status).to.eq(417); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids is an integer', () => {
            cy.Put(orderEndpoint(), { ids: 123 }, { failOnStatusCode: false }).then((response) => { expect(response.status).to.eq(417); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids contains a non-numeric value', () => {
            cy.Put(orderEndpoint(), { ids: ['invalid'] }, { failOnStatusCode: false }).then((response) => { expect(response.status).to.eq(417); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids contains a decimal value', () => {
            cy.Put(orderEndpoint(), { ids: [1.5] }, { failOnStatusCode: false }).then((response) => { expect(response.status).to.eq(417); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids contains a null value', () => {
            cy.Put(orderEndpoint(), { ids: [null] }, { failOnStatusCode: false }).then((response) => { expect(response.status).to.eq(417); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 or 422 when ids contains duplicate ids', () => {
            cy.Put(orderEndpoint(), { ids: [images[0].id, images[0].id] }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.be.oneOf([417, 422]); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains a deleted image id', () => {
            cy.Put(orderEndpoint(), { ids: [deletedImageId] }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains an unpublished image id', () => {
            cy.Put(orderEndpoint(), { ids: [unpublishedImageId] }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains a secondary-site image id', () => {
            cy.Put(orderEndpoint(), { ids: [secondarySiteImageId] }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains another reseller image id', () => {
            cy.Put(orderEndpoint(), { ids: [anotherResellerImageId] }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Path Verifications', () => {
        const validIds = () => images.map(img => img.id);

        it('should return 404 for non-existent site_id', () => {
            cy.Put(`/sites/999999/instances/${instanceId}/pages/${pageId}/images/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for deleted site_id', () => {
            cy.Put(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/images/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for another reseller site_id', () => {
            cy.Put(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/images/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for non-existent instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/999999/pages/${pageId}/images/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for non-existent page_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/999999/images/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id belonging to another instance', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/images/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('Security - URL Path Parameter', () => {
        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 for security payload as site_id - ${key}`, () => {
                cy.Put(`/sites/${encodeURIComponent(securityPayloads[key])}/instances/${instanceId}/pages/${pageId}/images/order`,
                    { ids: [] }, { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 for security payload as page_id - ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads[key])}/images/order`,
                    { ids: [] }, { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });

    describe('HTTP Method Validation', () => {
        it('should return 405 for GET request to /order endpoint', () => {
            cy.GetItems(orderEndpoint(), { failOnStatusCode: false }).then((response) => { expect(response.status).to.eq(405); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for POST request to /order endpoint', () => {
            cy.Post(orderEndpoint(), { ids: images.map(img => img.id) }, { failOnStatusCode: false })
                .then((response) => { expect(response.status).to.eq(405); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for DELETE request to /order endpoint', () => {
            cy.Delete(orderEndpoint(), { failOnStatusCode: false }).then((response) => { expect(response.status).to.eq(405); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });
    });
});
