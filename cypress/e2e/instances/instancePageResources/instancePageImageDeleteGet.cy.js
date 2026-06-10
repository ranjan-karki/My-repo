import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { InputBody } from "../../../support/inputBody";
import { SITES, THEMES, TIMEOUTS, IMAGE_IDs } from "../../../support/testConfig";

describe('Delete and Get Instance Page Image Tests', () => {
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
    let images      = [];
    let sharedImageId;
    let imageIndex  = 0;

    const getNextImage = () => images[imageIndex++];

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
            images        = response.body.body.data.map(i => ({ id: i.id }));
            sharedImageId = images[0].id;
        });
    });

    beforeEach(() => { cy.loginAndGetToken(); });

    describe('DELETE - Detach Image from Page', () => {
        describe('Positive Scenarios', () => {
            it('should detach image successfully', () => {
                const { id: imageId } = getNextImage();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                    { order: Order }, { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });

            it('should confirm image is no longer in list after detach', () => {
                const { id: imageId } = getNextImage();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                    { order: Order }, { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                        { failOnStatusCode: false }
                    ).then((deleteResponse) => {
                        expect(deleteResponse.status).to.eq(200);
                        cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images`,
                            { failOnStatusCode: false }
                        ).then((listResponse) => {
                            expect(listResponse.status).to.eq(200);
                            const list = Array.isArray(listResponse.body.body) ? listResponse.body.body : (listResponse.body.body.data || []);
                            expect(list.find(i => i.id === imageId)).to.not.exist;
                            expect(listResponse.duration).to.be.lessThan(responseTimeLimit);
                        });
                    });
                });
            });

            it('should return 404 when trying to detach an already-detached image', () => {
                const { id: imageId } = getNextImage();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                    { order: Order }, { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                        { failOnStatusCode: false }
                    ).then((firstDelete) => {
                        expect(firstDelete.status).to.eq(200);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                            { failOnStatusCode: false }
                        ).then((response) => {
                            expect(response.status).to.eq(404);
                            expect(response.duration).to.be.lessThan(responseTimeLimit);
                        });
                    });
                });
            });
        });

        describe('Image ID Verifications', () => {
            it('should return 404 for non-existent image_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/999999`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for image_id as negative integer', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/-1`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for image_id as non-numeric string', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/invalid_id`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for image not attached to this page', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for deleted image_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${deletedImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for unpublished image_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${unpublishedImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for image_id belonging to a secondary site', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${secondarySiteImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for image_id belonging to another reseller', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${anotherResellerImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for image_id as security payload - ${key}`, () => {
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${encodeURIComponent(securityPayloads[key])}`,
                        { failOnStatusCode: false }
                    ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
                });
            });
        });

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.Delete(`/sites/999999/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for deleted site_id', () => {
                cy.Delete(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.Delete(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/images/${sharedImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.Delete(`/sites/${site_id}/instances/999999/pages/${pageId}/images/${sharedImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/999999/images/${sharedImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/images/${sharedImageId}`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });

    describe('GET - List Page Images', () => {
        describe('Positive Scenarios', () => {
            it('should return 200 and a list for valid page', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images`,
                    { failOnStatusCode: false }
                ).then((response) => { expect(response.status).to.eq(200); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return an array in the response body', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                    expect(list).to.be.an('array');
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should confirm attached image appears in the list', () => {
                const { id: imageId } = getNextImage();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images/${imageId}`,
                    { order: Order }, { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/images`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                        expect(list.find(i => i.id === imageId)).to.exist;
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.GetItems(`/sites/999999/instances/${instanceId}/pages/${pageId}/images`, { failOnStatusCode: false })
                    .then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/999999/pages/${pageId}/images`, { failOnStatusCode: false })
                    .then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/999999/images`, { failOnStatusCode: false })
                    .then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/images`, { failOnStatusCode: false })
                    .then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/images`, { failOnStatusCode: false })
                    .then((response) => { expect(response.status).to.eq(404); cy.expect(response.body.status.message).to.eq(messages.notFound); expect(response.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });
});
