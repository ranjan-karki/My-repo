import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Update Instance Button Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;

    const placementNavbar   = 'navbar';
    const placementHeader   = 'header';
    const typeLink          = 'link';
    const typeModal         = 'modal';
    const typeScroll        = 'scroll';
    const statusUnpublish   = 1;
    const statusPublished   = 2;
    const styleCustom       = 0;
    const stylePrimary      = 1;
    const styleSecondary    = 2;
    const contentUrl        = 'https://example.com';
    const contentModal      = 'Modal content';
    const contentScroll     = '#section-hero';
    const Order             = 1;

    let instanceId;
    let buttonSettingId;
    let buttonId;

    before(() => {
        cy.loginAndGetToken();

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), "#123456", "#654321", true, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;

            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/settings`, { failOnStatusCode: false }).then((settingsResponse) => {
                expect(settingsResponse.status).to.eq(200);
                const body = settingsResponse.body.body;
                const data = Array.isArray(body) ? body : (body.data ?? [body]);
                const buttonSetting = data.find(s => s.key === 'buttons') ?? data[0];
                buttonSettingId = buttonSetting.id;

                cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${buttonSettingId}`,
                    InputBody.instanceSettings('buttons', true),
                    { failOnStatusCode: false }
                ).then((putResponse) => {
                    expect(putResponse.status).to.eq(200);

                    cy.Post(`/sites/${site_id}/button-resources`,
                        InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, '#ffffff', '#000000', Order, statusUnpublish, typeLink, contentUrl, null),
                        { failOnStatusCode: false }
                    ).then((createResponse) => {
                        expect(createResponse.status).to.eq(200);
                        buttonId = createResponse.body.body.id;
                    });
                });
            });
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // ─── Positive Scenarios ───────────────────────────────────────────────────

    describe('Positive Scenarios', () => {
        it('should update button with all valid fields', () => {
            const title = randomAlphaNumeric(10);
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(title, placementHeader, 'fas fa-star', styleSecondary, 'updated-class', '#000000', '#ffffff', 2, statusPublished, typeModal, 'Updated modal content', '{"updated":"value"}'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.body.body.placement).to.eq(placementHeader);
                expect(response.body.body.button_style).to.eq(styleSecondary);
                expect(response.body.body.status).to.eq(statusPublished);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with placement as navbar', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.placement).to.eq(placementNavbar);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with placement as header', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementHeader, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.placement).to.eq(placementHeader);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button type from link to modal', () => {
            const content = 'This is modal content';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.type).to.eq(typeModal);
                expect(response.body.body.content).to.eq(content);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button type from modal to scroll', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, contentScroll, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.type).to.eq(typeScroll);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button type from scroll to link', () => {
            const content = 'https://updated.com';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.type).to.eq(typeLink);
                expect(response.body.body.content).to.eq(content);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with status as 1 (unpublish)', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.status).to.eq(statusUnpublish);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with status as 2 (published)', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusPublished, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.status).to.eq(statusPublished);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with title at max char limit (100)', () => {
            const title = randomAlphaNumeric(100);
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(title, placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with title at min char limit (1)', () => {
            const title = 'A';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(title, placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with 6-digit hex colors', () => {
            const textColor = '#aabbcc';
            const bgColor = '#112233';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, textColor, bgColor, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.text_color).to.eq(textColor);
                expect(response.body.body.background_color).to.eq(bgColor);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with 3-digit hex colors', () => {
            const textColor = '#abc';
            const bgColor = '#123';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, textColor, bgColor, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with optional fields as null', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with valid icon class name', () => {
            const icon = 'fas fa-edit';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, icon, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.icon).to.eq(icon);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with valid class_name at max limit (50)', () => {
            const className = randomAlphaNumeric(50);
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, className, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.class_name).to.eq(className);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with property as valid JSON object', () => {
            const property = '{"updated":"true"}';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, property),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button order to a new positive integer', () => {
            const order = 5;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Title Verifications ──────────────────────────────────────────────────

    describe('Title Verifications', () => {
        it('should reject title exceeding max char limit (101)', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(randomAlphaNumeric(101), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject title as empty string', () => {
            const title = '';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(title, placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject title as null', () => {
            const title = null;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(title, placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject title as integer type', () => {
            const title = 12345;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(title, placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should update button with title as security payload - ${key} (input sanitized)`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(securityPayloads[key], placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Placement Verifications ──────────────────────────────────────────────

    describe('Placement Verifications', () => {
        it('should reject placement as invalid string (footer)', () => {
            const placement = 'footer';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placement, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementInvalid);
            });
        });

        it('should reject placement as empty string', () => {
            const placement = '';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placement, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementRequired);
            });
        });

        it('should reject placement as null', () => {
            const placement = null;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placement, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementRequired);
            });
        });

        it('should reject placement as integer type', () => {
            const placement = 123;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placement, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject placement as NAVBAR (uppercase)', () => {
            const placement = 'NAVBAR';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placement, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementInvalid);
            });
        });

        it('should reject placement as Navbar (mixed case)', () => {
            const placement = 'Navbar';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placement, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementInvalid);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject placement as security payload - ${key}`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(getRandomSubstring(8), securityPayloads[key], null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Type Verifications ───────────────────────────────────────────────────

    describe('Type Verifications', () => {
        it('should reject type as invalid string (button)', () => {
            const type = 'button';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, type, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.type[0]).to.eq(messages.instanceButtons.typeInvalid);
            });
        });

        it('should reject type as empty string', () => {
            const type = '';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, type, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.type[0]).to.eq(messages.instanceButtons.typeRequired);
            });
        });

        it('should reject type as null', () => {
            const type = null;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, type, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.type[0]).to.eq(messages.instanceButtons.typeRequired);
            });
        });

        it('should reject type as LINK (uppercase)', () => {
            const type = 'LINK';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, type, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.type[0]).to.eq(messages.instanceButtons.typeInvalid);
            });
        });

        it('should reject type as integer', () => {
            const type = 123;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, type, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject type as security payload - ${key}`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, securityPayloads[key], contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Content Verifications - Link Type ────────────────────────────────────

    describe('Content Verifications - Link Type', () => {
        it('should update button with type link and content as valid URL', () => {
            const content = 'https://updated-url.com';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.content).to.eq(content);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type link with content as invalid URL format', () => {
            const content = 'not-a-url';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type link with content as empty string', () => {
            const content = '';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.content[0]).to.eq(messages.instanceButtons.contentRequired);
            });
        });

        it('should reject type link with content as plain text', () => {
            const content = 'plain text content';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Content Verifications - Modal Type ──────────────────────────────────

    describe('Content Verifications - Modal Type', () => {
        it('should update button with type modal and content as text input', () => {
            const content = 'Updated modal content text';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.content).to.eq(content);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with type modal and content as HTML text', () => {
            const content = '<p>Updated <strong>HTML</strong> content</p>';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type modal with content as empty string', () => {
            const content = '';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.content[0]).to.eq(messages.instanceButtons.contentRequired);
            });
        });

        it('should update button with type modal and long HTML content', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, '<p>' + randomAlphaNumeric(500) + '</p>', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Content Verifications - Scroll Type ─────────────────────────────────

    describe('Content Verifications - Scroll Type', () => {
        it('should update button with type scroll and content as valid element id', () => {
            const content = '#updated-section';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.content).to.eq(content);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type scroll with content as element id without hash', () => {
            const content = 'section-hero';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type scroll with content as empty string', () => {
            const content = '';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.content[0]).to.eq(messages.instanceButtons.contentRequired);
            });
        });

        it('should reject type scroll with content as URL', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Button Style Verifications ───────────────────────────────────────────

    describe('Button Style Verifications', () => {
        [styleCustom, stylePrimary, styleSecondary].forEach((style) => {
            it(`should update button with button_style as ${style}`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, style, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.body.button_style).to.eq(style);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should reject button_style as 3', () => {
            const buttonStyle = 3;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, buttonStyle, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject button_style as -1', () => {
            const buttonStyle = -1;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, buttonStyle, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject button_style as string type', () => {
            const buttonStyle = 'solid';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, buttonStyle, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject button_style as null', () => {
            const buttonStyle = null;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, buttonStyle, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject button_style as decimal (1.5)', () => {
            const buttonStyle = 1.5;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, buttonStyle, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject button_style as security payload - ${key}`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, securityPayloads[key], null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Order Verifications ──────────────────────────────────────────────────

    describe('Order Verifications', () => {
        it('should reject order as 0', () => {
            const order = 0;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderMin);
            });
        });

        it('should reject order as negative integer', () => {
            const order = -1;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderMin);
            });
        });

        it('should reject order as empty value', () => {
            const order = '';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderRequired);
            });
        });

        it('should reject order as null', () => {
            const order = null;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderRequired);
            });
        });

        it('should reject order as string type', () => {
            const order = 'first';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderInteger);
            });
        });

        it('should reject order as decimal (1.5)', () => {
            const order = 1.5;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderInteger);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject order as security payload - ${key}`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, securityPayloads[key], statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Status Verifications ─────────────────────────────────────────────────

    describe('Status Verifications', () => {
        it('should reject status as null', () => {
            const status = null;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, status, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });

        it('should reject status as empty string', () => {
            const status = '';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, status, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });

        it('should reject status as string true', () => {
            const status = 'true';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, status, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
            });
        });

        it('should reject status as 3 (out of range)', () => {
            const status = 3;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, status, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
            });
        });
    });

    // ─── Icon Verifications ───────────────────────────────────────────────────

    describe('Icon Verifications', () => {
        it('should reject icon exceeding max char limit (101)', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, randomAlphaNumeric(101), stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject icon as integer type', () => {
            const icon = 12345;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, icon, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should update button with icon as security payload - ${key} (input sanitized)`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, securityPayloads[key], stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Class Name Verifications ─────────────────────────────────────────────

    describe('Class Name Verifications', () => {
        it('should reject class_name exceeding max char limit (51)', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, randomAlphaNumeric(51), null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject class_name as integer type', () => {
            const className = 12345;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, className, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should update button with class_name as security payload - ${key} (input sanitized)`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, securityPayloads[key], null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Text Color Verifications ─────────────────────────────────────────────

    describe('Text Color Verifications', () => {
        it('should reject text_color without hash symbol', () => {
            const textColor = 'ffffff';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, textColor, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject text_color with invalid hex characters (#gggggg)', () => {
            const textColor = '#gggggg';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, textColor, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject text_color exceeding valid format (#fffffff)', () => {
            const textColor = '#fffffff';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, textColor, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject text_color as integer type', () => {
            const textColor = 16777215;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, textColor, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject text_color as RGB format', () => {
            const textColor = 'rgb(255,255,255)';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, textColor, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject text_color as security payload - ${key}`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, securityPayloads[key], null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Background Color Verifications ──────────────────────────────────────

    describe('Background Color Verifications', () => {
        it('should reject background_color without hash symbol', () => {
            const bgColor = '000000';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, bgColor, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject background_color with invalid hex characters (#zzzzzz)', () => {
            const bgColor = '#zzzzzz';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, bgColor, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject background_color as integer type', () => {
            const bgColor = 0;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, bgColor, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject background_color as security payload - ${key}`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, securityPayloads[key], Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Property Verifications ───────────────────────────────────────────────

    describe('Property Verifications', () => {
        it('should reject property as plain string (invalid JSON)', () => {
            const property = 'plain string';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, property),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject property as integer type', () => {
            const property = 12345;
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, property),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject property as malformed JSON', () => {
            const property = '{key: value}';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, property),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with property containing JS script in JSON value (sanitized)', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, `{"key":"${securityPayloads.xss}"}`),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update button with property containing SQL injection in JSON value (sanitized)', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, `{"key":"${securityPayloads.sql}"}`),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Type-Content Mismatch ────────────────────────────────────────────────

    describe('Type-Content Mismatch', () => {
        it('should reject type link but content as element id', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentScroll, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type modal but content as URL', () => {
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type scroll but content as plain text', () => {
            const content = 'plain text';
            cy.Put(`/sites/${site_id}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Button ID Verifications ──────────────────────────────────────────────

    describe('Button ID Verifications', () => {
        it('should reject update with non-existent button_id', () => {
            cy.Put(`/sites/${site_id}/button-resources/999999`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject update with button_id as 0', () => {
            cy.Put(`/sites/${site_id}/button-resources/0`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with button_id as negative integer', () => {
            cy.Put(`/sites/${site_id}/button-resources/-1`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with button_id as invalid string', () => {
            cy.Put(`/sites/${site_id}/button-resources/invalid_id`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject update with button_id as security payload - ${key}`, () => {
                cy.Put(`/sites/${site_id}/button-resources/${encodeURIComponent(securityPayloads[key])}`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Site ID Verifications ────────────────────────────────────────────────

    describe('Site ID Verifications', () => {
        it('should reject update with non-existent site_id', () => {
            cy.Put(`/sites/999999/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject update with deleted site_id', () => {
            cy.Put(`/sites/${deleted_site}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject update with another reseller site_id', () => {
            cy.Put(`/sites/${another_reseller_site}/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject update with invalid (non-numeric) site_id', () => {
            cy.Put(`/sites/invalid_site_id/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject update with site_id as negative integer', () => {
            cy.Put(`/sites/-1/button-resources/${buttonId}`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject update with site_id as security payload - ${key}`, () => {
                cy.Put(`/sites/${encodeURIComponent(securityPayloads[key])}/button-resources/${buttonId}`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });
});
