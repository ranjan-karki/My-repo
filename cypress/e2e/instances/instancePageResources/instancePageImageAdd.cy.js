import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { InputBody } from "../../../support/inputBody";
import { SITES, THEMES, TIMEOUTS, IMAGE_IDs } from "../../../support/testConfig";

describe('Add Instance Page Image Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedImageId, unpublished: unpublishedImageId, secondarSiteImage: secondarySiteImageId, AnotherResellerimage: anotherResellerImageId } = IMAGE_IDs;
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
    let image_ids = [];
    let sharedImageId;
    let imageIdIndex = 1;

    const getNextImageId = () => image_ids[imageIdIndex++];

    before(() => {
        cy.loginAndGetToken();

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;

            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: `Page ${randomAlphaNumeric(5)}`, status: true },
                { failOnStatusCode: false }
            ).then((pageResponse) => {
                expect(pageResponse.status).to.eq(200);
                pageId = pageResponse.body.body.id;
            });
        });

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            const otherInstanceId = response.body.body.id;
            cy.Post(`/sites/${site_id}/instances/${otherInstanceId}/pages`,
                { title: `Other Page ${randomAlphaNumeric(5)}`, status: true },
                { failOnStatusCode: false }
            ).then((pageResponse) => {
                expect(pageResponse.status).to.eq(200);
                anotherInstancePageId = pageResponse.body.body.id;
            });
        });

        cy.GetItems(`/sites/${another_reseller_site}/instances`, { failOnStatusCode: false }).then((response) => {
            if (response.status === 200 && response.body.body.length > 0) anotherSiteInstanceId = response.body.body[0].id;
        });

        cy.GetItems(`/v2/sites/${site_id}/available-images`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            image_ids    = response.body.body.data.map(i => i.id);
            sharedImageId = image_ids[0];
        });
    });

    beforeEach(() => { cy.loginAndGetToken(); });

    describe('Order Field - Valid', () => {
        it('should attach image with valid order value', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${getNextImageId()}`,
                { order: 5 }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body).to.eq(true);
                expect(response.body.status.code).to.eq('ok');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should attach image with order as 1', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${getNextImageId()}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach image with order as 0', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${getNextImageId()}`,
                { order: 0 }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach image with order as large positive integer (999)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${getNextImageId()}`,
                { order: 999 }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach image with order as negative integer (-1)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${getNextImageId()}`,
                { order: -1 }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('Order Field - Invalid', () => {
        it('should reject order as empty value', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: '' }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: null }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: 'first' }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as decimal (1.5)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: 1.5 }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as boolean true', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: true }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in order input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                    { order: securityPayloads[key] }, { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(417); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });

    describe('URL Param - Site', () => {
        it('should return 404 for non-existent site_id', () => {
            cy.Post(`/sites/999999/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for deleted site_id', () => {
            cy.Post(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for another reseller site_id', () => {
            cy.Post(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for site_id as string type', () => {
            cy.Post(`/sites/invalid_site/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Instance', () => {
        it('should return 404 for non-existent instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/999999/pages/${pageId}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for instance_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/invalid_id/pages/${pageId}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for instance_id as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/-1/pages/${pageId}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Page', () => {
        it('should return 404 for non-existent page_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/999999/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id belonging to another instance', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/invalid_page/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Image', () => {
        it('should attach image with valid image_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${getNextImageId()}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for non-existent image_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/999999`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for image_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/invalid_image`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for image_id as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/-1`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for deleted image_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${deletedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for unpublished image_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${unpublishedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for image_id belonging to a secondary site', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${secondarySiteImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for image_id belonging to another reseller', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${anotherResellerImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Param - Security', () => {
        it('should return 404 for site_id as XSS payload', () => {
            cy.Post(`/sites/${encodeURIComponent(securityPayloads.xss)}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id as directory traversal', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads.pathTraversal)}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('Duplicate and Conflict', () => {
        it('should return 409 when attaching same image twice to the same page', () => {
            const imageId = getNextImageId();
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((firstResponse) => {
                expect(firstResponse.status).to.eq(200);
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                    { order: Order }, { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(409);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Edge Cases', () => {
        it('should return 417 for empty JSON payload', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                {}, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(417); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach image and ignore extra/unexpected fields', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${getNextImageId()}`,
                { order: Order, extra: 'ignored' }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for GET request to POST endpoint', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(405); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for PUT request to POST endpoint', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(405); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for DELETE request to POST endpoint', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                { failOnStatusCode: false }
            ).then((response) => { expect(response.status).to.eq(405); expect(response.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('Response Validation', () => {
        it('should return correct response body structure on successful POST', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${getNextImageId()}`,
                { order: Order }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body).to.eq(true);
                expect(response.body.status.code).to.eq('ok');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should verify image appears in GET list after successful POST', () => {
            const imageId = getNextImageId();
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                { order: 2 }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images`,
                    { failOnStatusCode: false }
                ).then((getResponse) => {
                    expect(getResponse.status).to.eq(200);
                    const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data || []);
                    expect(list.find(i => i.id === imageId)).to.exist;
                    expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });
});
