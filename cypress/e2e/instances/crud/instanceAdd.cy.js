import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Create Instance Tests', () => {
    const { main: site_id, secondary: secondary_site, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    let primaryLayout = THEMES.theme2;

    const displayLogoTrue  = true;
    const displayLogoFalse = false;
    let primaryColor       = '#123456';
    let secondaryColor     = '#654321';
    let title              = randomAlphaNumeric(5);
    let message            =getRandomSubstring(50);
    let slug = randomAlphaNumeric(8).toLowerCase();

    beforeEach(() => {
        cy.loginAndGetToken();
        slug          = randomAlphaNumeric(8).toLowerCase();
        title         = randomAlphaNumeric(5);
        message       = getRandomSubstring(50);
        primaryColor  = '#123456';
        secondaryColor = '#654321';
        primaryLayout = THEMES.theme2;
    });

    describe('Positive Scenarios', () => {
        it('should create instance with all valid fields', () => {
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create instance with display_logo false', () => {
            primaryColor   = "#111111";
            secondaryColor = "#222222";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoFalse, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create instance with title at max length (255 chars)', () => {
            title = randomAlphaNumeric(255);
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create instance with title at min length (1 char)', () => {
            title = randomAlphaNumeric(1);
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create instance with large message text', () => {
            message = randomAlphaNumeric(500);
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create instance with 3-char hex colors', () => {
            primaryColor   = "#FFF";
            secondaryColor = "#000";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create instance with 6-char hex colors', () => {
            primaryColor   = "#FFFFFF";
            secondaryColor = "#000000";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Title Verifications', () => {
        it('should reject empty title', () => {
            title = "";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject title exceeding 255 characters', () => {
            title = randomAlphaNumeric(256);
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleMax);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in title input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                    securityPayloads[key], message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Layout Verifications', () => {
        it('should create instance with empty layout', () => {
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, "", slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.layout[0]).to.eq(messages.instances.layoutRequired);
            });
        });

        it('should reject invalid layout value', () => {
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, "invalid_layout_xyz", slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(422);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.instances.layoutInvalid);
            });
        });

        it('should reject layout as integer', () => {
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, 12345, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.layout[0]).to.eq(messages.instances.layoutType);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in layout input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                    title, message, primaryColor, secondaryColor, displayLogoTrue, securityPayloads[key], slug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(422);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.instances.layoutInvalid);
                });
            });
        });
    });

    describe('Message Verifications', () => {
        it('should reject empty message', () => {
            message = "";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.message[0]).to.eq(messages.messageRequired);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in message input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                    title, securityPayloads[key], primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.not.eq(500);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Primary Color Verifications', () => {
        it('should reject empty primary_color', () => {
            primaryColor = "";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.primaryColorRequired);
            });
        });

        it('should add primary_color without # prefix', () => {
            primaryColor = "123456";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
            });
        });

        it('should reject primary_color that is too short', () => {
            primaryColor = "#FF";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
            });
        });

        it('should reject primary_color that is too long', () => {
            primaryColor = "#FFFFFF999";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
            });
        });

        it('should reject primary_color as integer', () => {
            primaryColor = 123456;
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorType);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in primary_color input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                    title, message, securityPayloads[key], secondaryColor, displayLogoTrue, primaryLayout, slug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                });
            });
        });
    });

    describe('Secondary Color Verifications', () => {
        it('should reject empty secondary_color', () => {
            secondaryColor = "";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.secondaryColorRequired);
            });
        });

        it('should adds secondary_color without # prefix', () => {
            secondaryColor = "654321";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
            });
        });

        it('should reject secondary_color that is too short', () => {
            secondaryColor = "#FF";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
            });
        });

        it('should reject secondary_color that is too long', () => {
            secondaryColor = "#FFFFFF999";
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
            });
        });

        it('should reject secondary_color as integer', () => {
            secondaryColor = 654321;
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorType);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in secondary_color input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                    title, message, primaryColor, securityPayloads[key], displayLogoTrue, primaryLayout, slug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                });
            });
        });
    });

    describe('Display Logo Verifications', () => {
        it('should reject display_logo as plain string', () => {
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, "not_a_url", primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.display_logo[0]).to.eq(messages.instances.invalidDisplayLogo);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in display_logo input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                    title, message, primaryColor, secondaryColor, securityPayloads[key], primaryLayout, slug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Site ID Verifications', () => {
        it('should reject non-existent site_id', () => {
            cy.Post(`/sites/999999/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
        it('should reject deleted site_id', () => {
            cy.Post(`/sites/${deleted_site}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
        it('should reject another reseller site_id', () => {
            cy.Post(`/sites/${another_reseller_site}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject invalid (non-numeric) site_id', () => {
            cy.Post(`/sites/invalid_site_id/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Extremely Large Input ────────────────────────────────────────────────

    describe('Extremely Large Input', () => {
        it('should reject title as 10,000 characters', () => {
            title          = 'a'.repeat(10_000);
            message        = getRandomSubstring(50);
            primaryColor   = '#123456';
            secondaryColor = '#654321';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject title as 1MB string', () => {
            title          = 'a'.repeat(1024 * 1024);
            message        = getRandomSubstring(50);
            primaryColor   = '#123456';
            secondaryColor = '#654321';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept message as 10,000 characters', () => {
            title          = randomAlphaNumeric(5);
            message        = 'a'.repeat(10_000);
            primaryColor   = '#123456';
            secondaryColor = '#654321';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept message as 100,000 characters', () => {
            title          = randomAlphaNumeric(5);
            message        = 'a'.repeat(100_000);
            primaryColor   = '#123456';
            secondaryColor = '#654321';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept message as 1MB string', () => {
            title          = randomAlphaNumeric(5);
            message        = 'a'.repeat(1024 * 1024);
            primaryColor   = '#123456';
            secondaryColor = '#654321';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject primaryColor as 10,000 characters', () => {
            title          = randomAlphaNumeric(5);
            message        = getRandomSubstring(50);
            primaryColor   = 'a'.repeat(10_000);
            secondaryColor = '#654321';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject secondaryColor as 10,000 characters', () => {
            title          = randomAlphaNumeric(5);
            message        = getRandomSubstring(50);
            primaryColor   = '#123456';
            secondaryColor = 'a'.repeat(10_000);
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject layout as 10,000 characters', () => {
            title         = randomAlphaNumeric(5);
            message       = getRandomSubstring(50);
            primaryColor  = '#123456';
            secondaryColor = '#654321';
            primaryLayout = 'a'.repeat(10_000);
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Slug Verifications', () => {
        it('should create instance with valid slug (lowercase alphanumeric)', () => {
            slug = randomAlphaNumeric(8).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create instance with slug containing hyphens', () => {
            slug = 'valid-' + randomAlphaNumeric(4).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create instance with slug at max limit (60 chars)', () => {
            slug = randomAlphaNumeric(60).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug at max limit +1 (61 chars)', () => {
            slug = randomAlphaNumeric(61).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugMax);
            });
        });

        it('should create instance with slug at min limit (1 char)', () => {
            slug = randomAlphaNumeric(1).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject empty slug', () => {
            slug = '';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugRequired);
            });
        });

        it('should reject slug containing uppercase letters', () => {
            slug = 'ValidSlug';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug containing spaces', () => {
            slug = 'valid slug';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug starting with hyphen', () => {
            slug = '-validslug';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug ending with hyphen', () => {
            slug = 'validslug-';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug containing consecutive hyphens', () => {
            slug = 'valid--slug';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug containing underscore', () => {
            slug = 'valid_slug';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug containing special characters', () => {
            slug = 'valid@slug!';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug containing period/dot', () => {
            slug = 'valid.slug';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug as integer', () => {
            slug = 12345;
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugType);
            });
        });

        it('should reject slug as long integer', () => {
            slug = 999999999999999;
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugType);
            });
        });

        it('should reject slug as boolean', () => {
            slug = true;
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugType);
            });
        });

        it('should reject slug as null', () => {
            slug = null;
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugRequired);
            });
        });

        it('should create instance with slug containing only numbers', () => {
            slug = String(Math.floor(10000 + Math.random() * 90000));
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create instance with slug containing numbers and letters', () => {
            slug = 'slug' + randomAlphaNumeric(4).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug as single hyphen', () => {
            slug = '-';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug containing unicode characters', () => {
            slug = 'válid-slüg';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug containing encoded characters (%20)', () => {
            slug = 'valid%20slug';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject slug containing HTML tags', () => {
            slug = '<b>slug</b>';
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
            });
        });

        it('should reject duplicate slug within the same site', () => {
            const uniqueSlug = 'dup-' + randomAlphaNumeric(8).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, uniqueSlug
            ), { failOnStatusCode: false }).then((firstResponse) => {
                expect(firstResponse.status).to.eq(200);
                cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                    title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, uniqueSlug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(409);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.status.message).to.eq(messages.instances.slugAlreadyTaken);
                });
            });
        });

        it('should allow reusing slug of a deleted instance', () => {
            const uniqueSlug = 'del-' + randomAlphaNumeric(8).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, uniqueSlug
            ), { failOnStatusCode: false }).then((createResponse) => {
                expect(createResponse.status).to.eq(200);
                const instanceId = createResponse.body.body.id;
                cy.Delete(`/sites/${site_id}/instances/${instanceId}`, { failOnStatusCode: false }).then((deleteResponse) => {
                    expect(deleteResponse.status).to.eq(200);
                    cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                        title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, uniqueSlug
                    ), { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

        it('should allow same slug in a different site (slug uniqueness is per site)', () => {
            const uniqueSlug = 'cross-' + randomAlphaNumeric(8).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, uniqueSlug
            ), { failOnStatusCode: false }).then((firstResponse) => {
                expect(firstResponse.status).to.eq(200);
                cy.Post(`/sites/${secondary_site}/instances`, InputBody.instances(
                    title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, uniqueSlug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in slug input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                    title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, securityPayloads[key]
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });
});
