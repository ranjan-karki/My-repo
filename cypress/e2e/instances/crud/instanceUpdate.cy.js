import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Update Instance Tests', () => {
    const { main: site_id, secondary: secondary_site, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    let primaryLayout   = THEMES.theme2;
    let secondaryLayout = THEMES.theme1;

    const displayLogoTrue   = true;
    const displayLogoFalse  = false;
    let primaryColor        = '#123456';
    let secondaryColor      = '#654321';
    let title               = randomAlphaNumeric(5);
    let message             = getRandomSubstring(50);
    let instanceId;
    let layout;
    let slug = randomAlphaNumeric(8).toLowerCase();

    before(() => {
        cy.loginAndGetToken();
        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
        slug           = randomAlphaNumeric(8).toLowerCase();
        primaryColor   = '#123456';
        secondaryColor = '#654321';
        primaryLayout  = THEMES.theme2;
    });


    describe('Positive Scenarios', () => {
        it('should update instance with all valid fields', () => {
            title          = randomAlphaNumeric(5);
            message        = getRandomSubstring(50);
            primaryColor   = '#123456';
            secondaryColor = '#654321';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, secondaryLayout
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.body.body.message).to.eq(message);
                expect(response.body.body.display_logo).to.eq(displayLogoTrue);
                expect(response.body.body.layout).to.eq(primaryLayout);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with display_logo false', () => {
            title          = randomAlphaNumeric(5);
            message        = getRandomSubstring(50);
            primaryColor   = "#111111";
            secondaryColor = "#222222";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoFalse, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.body.body.message).to.eq(message);
                expect(response.body.body.display_logo).to.eq(false);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with title at max length (255 chars)', () => {
            title = randomAlphaNumeric(255);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with title at min length (1 char)', () => {
            title = randomAlphaNumeric(1);

            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with large message text', () => {
            message = randomAlphaNumeric(500);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with 3-char hex colors', () => {
            primaryColor   = "#FFF";
            secondaryColor = "#000";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with 6-char hex colors', () => {
            primaryColor   = "#FFFFFF";
            secondaryColor = "#000000";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Single Property Update', () => {
        it('should update instance with only title', () => {
            title = randomAlphaNumeric(5);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { title }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with only message', () => {
            message = getRandomSubstring(50);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with only primary_color', () => {
            primaryColor = "#ABCDEF";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { primary_color: primaryColor }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.primary_color).to.eq(primaryColor);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with only secondary_color', () => {
            secondaryColor = primaryColor;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { secondary_color: secondaryColor }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.secondary_color).to.eq(secondaryColor);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with only display_logo', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { display_logo: displayLogoFalse }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.display_logo).to.eq(displayLogoFalse);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with only layout using primaryLayout', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { layout: primaryLayout }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.layout).to.eq(primaryLayout);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with only layout using secondaryLayout', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { layout: secondaryLayout }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.layout).to.eq(secondaryLayout);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with only slug', () => {
            let slug = randomAlphaNumeric(5);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.slug).to.eq(slug);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Title Verifications', () => {
        it('should reject empty title', () => {
            title = "";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject title exceeding 255 characters', () => {
            title = randomAlphaNumeric(256);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleMax);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in title input: ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                    securityPayloads[key], message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Layout Verifications', () => {
        it('should reject empty layout', () => {
            layout = "";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, layout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.layout[0]).to.eq(messages.instances.layoutRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject invalid layout value', () => {
            layout = "invalid_layout_xyz";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, layout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(422);
                cy.expect(response.body.status.message).to.eq(messages.instances.layoutInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject layout as integer', () => {
            layout = 12345;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, layout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.layout[0]).to.eq(messages.instances.layoutType);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in layout input: ${key}`, () => {
                layout = securityPayloads[key];
                cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                    title, message, primaryColor, secondaryColor, displayLogoTrue, layout, slug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(422);
                    cy.expect(response.body.status.message).to.eq(messages.instances.layoutInvalid);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Message Verifications', () => {
        it('should reject empty message', () => {
            message = "";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.message[0]).to.eq(messages.messageRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in message input: ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
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
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.primaryColorRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update primary_color without # prefix', () => {
            primaryColor = "123456";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject primary_color that is too short', () => {
            primaryColor = "#FF";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject primary_color that is too long', () => {
            primaryColor = "#FFFFFF999";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject primary_color as integer', () => {
            primaryColor = 123456;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in primary_color input: ${key}`, () => {
                primaryColor = securityPayloads[key];
                cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                    title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Secondary Color Verifications', () => {
        it('should reject empty secondary_color', () => {
            secondaryColor = "";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.secondaryColorRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update secondary_color without # prefix', () => {
            secondaryColor = "654321";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject secondary_color that is too short', () => {
            secondaryColor = "#FF";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject secondary_color that is too long', () => {
            secondaryColor = "#FFFFFF999";
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
        it('should reject secondary_color as integer', () => {
            secondaryColor = 654321;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in secondary_color input: ${key}`, () => {
                secondaryColor = securityPayloads[key];
                cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                    title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Display Logo Verifications', () => {
        it('should reject display_logo as plain string', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, "not_a_url", primaryLayout
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.display_logo[0]).to.eq(messages.instances.invalidDisplayLogo);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in display_logo input: ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}`, InputBody.instances(
                    title, message, primaryColor, secondaryColor, securityPayloads[key], primaryLayout
                ), { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Extremely Large Input ────────────────────────────────────────────────

    describe('Extremely Large Input', () => {
        it('should reject title as 10,000 characters', () => {
            title = 'a'.repeat(10_000);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { title }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject title as 1MB string', () => {
            title = 'a'.repeat(1024 * 1024);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { title }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept message as 10,000 characters', () => {
            message = 'a'.repeat(10_000);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept message as 100,000 characters', () => {
            message = 'a'.repeat(100_000);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept message as 1MB string', () => {
            message = 'a'.repeat(1024 * 1024);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { message }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.message).to.eq(message);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject primaryColor as 10,000 characters', () => {
            primaryColor = 'a'.repeat(10_000);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { primary_color: primaryColor }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject secondaryColor as 10,000 characters', () => {
            secondaryColor = 'a'.repeat(10_000);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { secondary_color: secondaryColor }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject layout as 10,000 characters', () => {
            primaryLayout = 'a'.repeat(10_000);
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { layout: primaryLayout }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Slug Verifications ───────────────────────────────────────────────────

    describe('Slug Verifications', () => {
        it('should update instance with valid slug', () => {
            slug = randomAlphaNumeric(8).toLowerCase();
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.slug).to.eq(slug);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with slug containing hyphens', () => {
            slug = `valid-slug-${randomAlphaNumeric(4).toLowerCase()}`;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.slug).to.eq(slug);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with slug at max limit (60 chars)', () => {
            slug = randomAlphaNumeric(60).toLowerCase();
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.slug).to.eq(slug);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug at max limit +1 (61 chars)', () => {
            slug = randomAlphaNumeric(61).toLowerCase();
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugMax);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update instance with slug at min limit (1 char)', () => {
            slug = randomAlphaNumeric(1).toLowerCase();
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.slug).to.eq(slug);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject empty slug', () => {
            slug = '';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug containing uppercase letters', () => {
            slug = 'ValidSlug';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug containing spaces', () => {
            slug = 'valid slug';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug starting with hyphen', () => {
            slug = '-validslug';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug ending with hyphen', () => {
            slug = 'validslug-';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug containing consecutive hyphens', () => {
            slug = 'valid--slug';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug containing underscore', () => {
            slug = 'valid_slug';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug containing special characters', () => {
            slug = 'valid@slug!';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug containing period/dot', () => {
            slug = 'valid.slug';
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug as integer type', () => {
            slug = 12345;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugType);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug as boolean type', () => {
            slug = true;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugType);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug as null', () => {
            slug = null;
            cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.slug[0]).to.eq(messages.instances.slugRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject slug already taken within the same site', () => {
            const uniqueSlug = 'dup-' + randomAlphaNumeric(8).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, uniqueSlug
            ), { failOnStatusCode: false }).then((firstResponse) => {
                expect(firstResponse.status).to.eq(200);
                cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug: uniqueSlug }, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(409);
                    cy.expect(response.body.status.message).to.eq(messages.instances.slugAlreadyTaken);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.Delete(`/sites/${site_id}/instances/${firstResponse.body.body.id}`, { failOnStatusCode: false });
                });
            });
        });

        it('should allow reusing slug of a deleted instance', () => {
            const uniqueSlug = 'del-' + randomAlphaNumeric(8).toLowerCase();
            cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, uniqueSlug
            ), { failOnStatusCode: false }).then((createResponse) => {
                expect(createResponse.status).to.eq(200);
                const tempId = createResponse.body.body.id;
                cy.Delete(`/sites/${site_id}/instances/${tempId}`, { failOnStatusCode: false }).then((deleteResponse) => {
                    expect(deleteResponse.status).to.eq(200);
                    cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug: uniqueSlug }, { failOnStatusCode: false }).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.body.body.slug).to.eq(uniqueSlug);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

        it('should allow same slug used in a different site', () => {
            const uniqueSlug = 'cross-' + randomAlphaNumeric(8).toLowerCase();
            cy.Post(`/sites/${secondary_site}/instances`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, uniqueSlug
            ), { failOnStatusCode: false }).then((firstResponse) => {
                expect(firstResponse.status).to.eq(200);
                cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug: uniqueSlug }, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.body.slug).to.eq(uniqueSlug);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in slug input: ${key}`, () => {
                slug = securityPayloads[key];
                cy.Put(`/sites/${site_id}/instances/${instanceId}`, { slug }, { failOnStatusCode: false }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Instance ID Verifications', () => {
        it('should reject non-existent instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/999999`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject invalid (non-numeric) instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/invalid_id`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject non-existent site_id', () => {
            cy.Put(`/sites/999999/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject deleted site_id', () => {
            cy.Put(`/sites/${deleted_site}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject another reseller site_id', () => {
            cy.Put(`/sites/${another_reseller_site}/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject invalid (non-numeric) site_id', () => {
            cy.Put(`/sites/invalid_site_id/instances/${instanceId}`, InputBody.instances(
                title, message, primaryColor, secondaryColor, displayLogoTrue, primaryLayout, slug
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });
});
