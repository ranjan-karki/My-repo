import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { fileUrls } from "../../../fixtures/fileUrls";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Homepage Layout Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    let validLayout = THEMES.theme1;

    const displayLogoTrue   = true;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    const subFooterTrue     = true;
    const subFooterFalse    = false;
    let instanceId;

    before(() => {
        cy.loginAndGetToken();
        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    after(() => {
        if (instanceId) {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}`, { failOnStatusCode: false });
        }
    });

    // POST acts as upsert: creates layout if none exists, updates if one already exists
    describe('POST - Create / Update Layout', () => {

        describe('Positive Scenarios', () => {
            it('should create/update instance layout with jpg image url', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout with jpeg image url', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpeg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout with png image url', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.png, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout with svg image url', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.svg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout with title at max length (255 chars)', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, randomAlphaNumeric(255), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout with title at min length (1 char)', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, randomAlphaNumeric(1), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout with footer at min length (1 char)', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), randomAlphaNumeric(1), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout with footer large char set', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(500), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout with sub_footer true', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout with sub_footer false', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterFalse
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout with missing sub_footer (uses default)', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, {
                    banner: fileUrls.jpg,
                    title: getRandomSubstring(10),
                    footer: getRandomSubstring(50)
                }, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should create/update instance layout and ignore extra unknown fields', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, {
                    ...InputBody.instanceLayouts(fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue),
                    unknown_field: "extra_value"
                }, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        describe('Banner Verifications', () => {
            it('should reject banner with empty url', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    "", getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.banner[0]).to.eq(messages.instanceLayouts.bannerRequired);
                });
            });

            it('should reject banner with invalid url format', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    "not-a-valid-url", getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.banner[0]).to.eq(messages.instanceLayouts.bannerInvalid);
                });
            });

            it('should reject banner with gif image url', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.gif, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.banner[0]).to.eq(messages.instanceLayouts.bannerInvalid);
                });
            });

            it('should reject banner with document file url', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.pdf, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.banner[0]).to.eq(messages.instanceLayouts.bannerInvalid);
                });
            });

            it('should reject banner with video url', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.mp4, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.banner[0]).to.eq(messages.instanceLayouts.bannerInvalid);
                });
            });
        });

        describe('Title Verifications', () => {
            it('should reject empty title', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, "", getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
                });
            });

            it('should reject title exceeding 255 characters', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, randomAlphaNumeric(256), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.title[0]).to.eq(messages.titleMax);
                });
            });

            it('should reject title with large char set (exceeds 255)', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, randomAlphaNumeric(500), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.title[0]).to.eq(messages.titleMax);
                });
            });

            it('should reject title as integer', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, 12345, getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.title[0]).to.eq(messages.titleType);
                });
            });

            it('should reject title as long integer', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, 999999999999999, getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.title[0]).to.eq(messages.titleType);
                });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should handle security verification in title input: ${key}`, () => {
                    cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                        fileUrls.jpg, securityPayloads[key], getRandomSubstring(50), subFooterTrue
                    ), { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

        describe('Footer Verifications', () => {
            it('should reject empty footer', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), "", subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.footer[0]).to.eq(messages.instanceLayouts.footerRequired);
                });
            });

            it('should reject footer as integer', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), 12345, subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.footer[0]).to.eq(messages.instanceLayouts.footerType);
                });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should handle security verification in footer input: ${key}`, () => {
                    cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                        fileUrls.jpg, getRandomSubstring(10), securityPayloads[key], subFooterTrue
                    ), { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

        describe('Sub-footer Verifications', () => {
            it('should reject empty sub_footer', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), ""
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.sub_footer[0]).to.eq(messages.instanceLayouts.subFooterRequired);
                });
            });

            it('should reject sub_footer as integer except 0/1', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), 2
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.sub_footer[0]).to.eq(messages.instanceLayouts.subFooterInvalid);
                });
            });

            it('should reject sub_footer as plain string', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), "yes"
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.sub_footer[0]).to.eq(messages.instanceLayouts.subFooterInvalid);
                });
            });

            it('should reject sub_footer as long char set', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), getRandomSubstring(500)
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.sub_footer[0]).to.eq(messages.instanceLayouts.subFooterInvalid);
                });
            });

            it('should reject sub_footer as long integer', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), 999999999999999
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.sub_footer[0]).to.eq(messages.instanceLayouts.subFooterInvalid);
                });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should handle security verification in sub_footer input: ${key}`, () => {
                    cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                        fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), securityPayloads[key]
                    ), { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(417);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                        cy.expect(response.body.body.sub_footer[0]).to.eq(messages.instanceLayouts.subFooterInvalid);
                    });
                });
            });
        });

        describe('Payload Verifications', () => {
            it('should reject empty payload', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, {}, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.banner[0]).to.eq(messages.instanceLayouts.bannerRequired);
                });
            });

            it('should reject payload with missing banner field', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, {
                    title: getRandomSubstring(10),
                    footer: getRandomSubstring(50),
                    sub_footer: subFooterTrue
                }, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.banner[0]).to.eq(messages.instanceLayouts.bannerRequired);
                });
            });

            it('should reject payload with missing title field', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, {
                    banner: fileUrls.jpg,
                    footer: getRandomSubstring(50),
                    sub_footer: subFooterTrue
                }, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
                });
            });

            it('should reject payload with missing footer field', () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, {
                    banner: fileUrls.jpg,
                    title: getRandomSubstring(10),
                    sub_footer: subFooterTrue
                }, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.footer[0]).to.eq(messages.instanceLayouts.footerRequired);
                });
            });
        });

        describe('Instance ID Verifications', () => {
            it('should reject non-existent instance_id', () => {
                cy.Post(`/sites/${site_id}/instances/999999/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });

            it('should reject invalid (non-numeric) instance_id', () => {
                cy.Post(`/sites/${site_id}/instances/invalid_id/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });

            it('should reject non-existent site_id', () => {
                cy.Post(`/sites/999999/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });

            it('should reject deleted site_id', () => {
                cy.Post(`/sites/${deleted_site}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });

            it('should reject another reseller site_id', () => {
                cy.Post(`/sites/${another_reseller_site}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });

            it('should reject invalid (non-numeric) site_id', () => {
                cy.Post(`/sites/invalid_site_id/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                    fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });
        });
    });

    describe('GET - Homepage Layout', () => {
        before(() => {
            cy.loginAndGetToken();
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, InputBody.instanceLayouts(
                fileUrls.jpg, getRandomSubstring(10), getRandomSubstring(50), subFooterTrue
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
            });
        });

        describe('Positive Scenarios', () => {
            it('should return homepage layout for a valid instance', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return response with all expected fields', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    const layout = response.body.body;
                    expect(layout).to.have.property('id');
                    expect(layout).to.have.property('instance_id');
                    expect(layout).to.have.property('site_id');
                    expect(layout).to.have.property('banner');
                    expect(layout).to.have.property('title');
                    expect(layout).to.have.property('footer');
                    expect(layout).to.have.property('sub_footer');
                    expect(layout).to.have.property('created_at');
                    expect(layout).to.have.property('updated_at');
                });
            });

            it('should return response with correct instance_id and site_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    expect(response.body.body.instance_id).to.eq(instanceId);
                    expect(response.body.body.site_id).to.eq(site_id);
                });
            });

            it('should return response with valid status object', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    expect(response.body.status).to.have.property('code');
                    expect(response.body.status).to.have.property('code_text');
                    expect(response.body.status).to.have.property('message');
                    expect(response.body.status.code).to.eq('ok');
                });
            });

            it('should return boolean value for sub_footer field', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    expect(response.body.body.sub_footer).to.be.a('boolean');
                });
            });
        });

        describe('Error Cases', () => {
            it('should return 404 for non-existent instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/999999/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });

            it('should return 404 for invalid (non-numeric) instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/invalid_id/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });

            it('should return 404 for non-existent site_id', () => {
                cy.GetItems(`/sites/999999/instances/${instanceId}/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });

            it('should return 404 for deleted site_id', () => {
                cy.GetItems(`/sites/${deleted_site}/instances/${instanceId}/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });

            it('should return 404 for invalid (non-numeric) site_id', () => {
                cy.GetItems(`/sites/invalid_site_id/instances/${instanceId}/homepage-layouts`, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                });
            });
        });
    });
});
