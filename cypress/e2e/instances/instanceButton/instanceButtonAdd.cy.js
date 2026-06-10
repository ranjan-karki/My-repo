import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Add Instance Button Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;

    const placementNavbar = 'navbar';
    const placementHeader = 'header';
    const typeLink = 'link';
    const typeModal = 'modal';
    const typeScroll = 'scroll';
    const statusUnpublish = 1;
    const statusPublished = 2;
    const styleCustom = 0;
    const stylePrimary = 1;
    const styleSecondary = 2;
    const contentUrl = 'https://example.com';
    const contentModal = 'Modal content';
    const contentScroll = '#section-hero';
    const Order = 1;

    let instanceId;
    let buttonSettingId;

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
                });
            });
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // â”€â”€â”€ Positive Scenarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Positive Scenarios', () => {
        it('should create button with all valid fields in payload', () => {
            const title = randomAlphaNumeric(10);
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(title, placementNavbar, 'fas fa-link', stylePrimary, 'my-btn', '#ffffff', '#000000', Order, statusUnpublish, typeLink, contentUrl, '{"key":"value"}'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.body.body.placement).to.eq(placementNavbar);
                expect(response.body.body.order).to.eq(Order);
                expect(response.body.body.type).to.eq(typeLink);
                expect(response.body.body.content).to.eq(contentUrl);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with mandatory fields only', () => {
            const title = randomAlphaNumeric(10);
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(title, placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // â”€â”€â”€ Title Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Title Verifications', () => {
        it('should create button with title at max char limit (100)', () => {
            const title = randomAlphaNumeric(100);
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(title, placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with title at min char limit (1)', () => {
            const title = 'A';
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(title, placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject title exceeding max char limit (101)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(randomAlphaNumeric(101), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject title as empty string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons('', placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject title as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(null, placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject title as integer type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(12345, placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload without title field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { placement: placementNavbar, button_style: stylePrimary, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should create button with title as security payload - ${key} (input sanitized)`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(securityPayloads[key], placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // â”€â”€â”€ Placement Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Placement Verifications', () => {
        it('should create button with placement as navbar', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with placement as header', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementHeader, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject placement as invalid string (footer)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), 'footer', null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementInvalid);
            });
        });

        it('should reject placement as empty string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), '', null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementRequired);
            });
        });

        it('should reject placement as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), null, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementRequired);
            });
        });

        it('should reject placement as integer type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), 123, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject placement as NAVBAR (uppercase)', () => {
            const placement = 'NAVBAR';
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
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
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placement, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementInvalid);
            });
        });

        it('should reject payload without placement field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), button_style: stylePrimary, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementRequired);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject placement as security payload - ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), securityPayloads[key], null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // â”€â”€â”€ Type Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Type Verifications', () => {
        it('should create button with type as link', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with type as modal', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, contentModal, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with type as scroll', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, contentScroll, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type as invalid string (button)', () => {
            const type = 'button';
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
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
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
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
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, type, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.type[0]).to.eq(messages.instanceButtons.typeRequired);
            });
        });

        it('should reject type as integer', () => {
            const type = 123;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, type, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type as LINK (uppercase)', () => {
            const type = 'LINK';
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, type, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.type[0]).to.eq(messages.instanceButtons.typeInvalid);
            });
        });

        it('should reject payload without type field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, order: Order, status: statusUnpublish, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.type[0]).to.eq(messages.instanceButtons.typeRequired);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject type as security payload - ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, securityPayloads[key], contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // â”€â”€â”€ Content Verifications - Link Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Content Verifications - Link Type', () => {
        it('should create button with type link and content as valid URL', () => {
            const content = 'https://example.com/page';
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, content, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type link with content as invalid URL format', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, 'not-a-url', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type link with content as empty string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, '', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.content[0]).to.eq(messages.instanceButtons.contentRequired);
            });
        });

        it('should reject type link with content as plain text', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, 'plain text content', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // â”€â”€â”€ Content Verifications - Modal Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Content Verifications - Modal Type', () => {
        it('should create button with type modal and content as text input', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, 'This is modal content text', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with type modal and content as HTML text', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, '<p>This is <strong>HTML</strong> content</p>', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type modal with content as empty string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, '', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.content[0]).to.eq(messages.instanceButtons.contentRequired);
            });
        });

        it('should create button with type modal and long HTML content (modal allows extended content)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, '<p>' + randomAlphaNumeric(500) + '</p>', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // â”€â”€â”€ Content Verifications - Scroll Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Content Verifications - Scroll Type', () => {
        it('should create button with type scroll and content as valid element id (#title)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, '#title', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type scroll with content as element id without hash', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, 'section-hero', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type scroll with content as empty string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, '', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.content[0]).to.eq(messages.instanceButtons.contentRequired);
            });
        });

        it('should reject type scroll with content as URL', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // â”€â”€â”€ Content Verifications - Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Content Verifications - Security', () => {
        it('should create button with content as JS script injection (input sanitized)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, securityPayloads.xss, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with content as SQL injection (input sanitized)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeModal, securityPayloads.sql, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // â”€â”€â”€ Button Style Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Button Style Verifications', () => {
        [0, 1, 2].forEach((style) => {
            it(`should create button with button_style as ${style}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, style, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should reject button_style as 3', () => {
            const buttonStyle = 3;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, buttonStyle, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject button_style as -1', () => {
            const buttonStyle = -1;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, buttonStyle, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject button_style as string type', () => {
            const buttonStyle = 'solid';
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, buttonStyle, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject button_style as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, null, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject button_style as decimal (1.5)', () => {
            const buttonStyle = 1.5;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, buttonStyle, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload without button_style field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject button_style as security payload - ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, securityPayloads[key], null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // â”€â”€â”€ Order Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Order Verifications', () => {
        it('should create button with order as positive integer', () => {
            const order = 5;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with order as 1', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as 0', () => {
            const order = 0;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
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
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderMin);
            });
        });

        it('should reject order as empty value', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, '', statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderRequired);
            });
        });

        it('should reject order as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, null, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderRequired);
            });
        });

        it('should reject order as string type', () => {
            const order = 'first';
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
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
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderInteger);
            });
        });

        it('should reject payload without order field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderRequired);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject order as security payload - ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, securityPayloads[key], statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // â”€â”€â”€ Status Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Status Verifications', () => {
        it('should create button with status as 1', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with status as 2', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusPublished, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject status as 0', () => {
            const status = 0;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, status, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
            });
        });

        it('should reject status as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, null, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });

        it('should reject status as empty string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, '', typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });

        it('should reject status as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, 'true', typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
            });
        });

        it('should reject payload without status field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, order: Order, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });
    });

    // â”€â”€â”€ Icon Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Icon Verifications', () => {
        it('should create button with valid icon class name (fas fa-hands)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, 'fas fa-hands', stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with another valid icon class (fab fa-firefox)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, 'fab fa-firefox', stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button without icon field (icon optional)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with icon as null (icon optional)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject icon exceeding max char limit (101)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, randomAlphaNumeric(101), stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject icon as integer type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, 12345, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should create button with icon as security payload - ${key} (input sanitized)`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, securityPayloads[key], stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // â”€â”€â”€ Class Name Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Class Name Verifications', () => {
        it('should create button with class_name at max char limit (50)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, randomAlphaNumeric(50), null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button without class_name field (class_name optional)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with class_name as null (class_name optional)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject class_name exceeding max char limit (51)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, randomAlphaNumeric(51), null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject class_name as integer type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, 12345, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should create button with class_name as security payload - ${key} (input sanitized)`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, securityPayloads[key], null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // â”€â”€â”€ Text Color Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Text Color Verifications', () => {
        it('should create button with text_color as valid 6-digit hash code (#ffffff)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, '#ffffff', null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with text_color as 3-digit hash code (#fff)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, '#fff', null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button without text_color field (text_color optional)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject text_color without hash symbol (ffffff)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, 'ffffff', null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject text_color with invalid hex characters (#gggggg)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, '#gggggg', null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject text_color exceeding valid format (#fffffff)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, '#fffffff', null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject text_color as integer type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, 16777215, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject text_color as RGB format', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, 'rgb(255,255,255)', null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject text_color as security payload - ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, securityPayloads[key], null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // â”€â”€â”€ Background Color Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Background Color Verifications', () => {
        it('should create button with background_color as valid 6-digit hash code (#000000)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, null, '#000000', Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with background_color as 3-digit hash code (#000)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, null, '#000', Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button without background_color field (background_color optional)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject background_color without hash symbol (000000)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, null, '000000', Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject background_color with invalid hex characters (#zzzzzz)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, null, '#zzzzzz', Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject background_color as integer type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, null, 0, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject background_color as security payload - ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, 1, null, null, securityPayloads[key], Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // â”€â”€â”€ Property Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Property Verifications', () => {
        it('should create button with property as valid JSON object', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, '{"key":"value"}'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with property as empty JSON object ({})', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, '{}'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button without property field (property optional)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with property as null (property optional)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with property as JSON array ([])', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, '[]'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with property as nested JSON object', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, '{"level1":{"level2":"value"}}'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with property as JSON with special characters in values', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, '{"key":"val@#$%"}'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject property as plain string (invalid JSON)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, 'plain string'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject property as integer type (non-JSON)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, 12345),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject property as malformed JSON (missing quotes)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, '{key: value}'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject property as boolean type (non-JSON string)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject property as JSON with unescaped quotes', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, '{"key": "val"ue"}'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with property containing JS script in JSON value (sanitized)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, `{"key":"${securityPayloads.xss}"}`),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create button with property containing SQL injection in JSON value (sanitized)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, `{"key":"${securityPayloads.sql}"}`),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // â”€â”€â”€ Site ID Verifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Site ID Verifications', () => {
        it('should create button with valid site id in URL path', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject create button with non-existent site id', () => {
            cy.Post(`/sites/999999/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject create button with deleted site id', () => {
            cy.Post(`/sites/${deleted_site}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject create button with unauthorized site id (another reseller)', () => {
            cy.Post(`/sites/${another_reseller_site}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject create button with site id as string type', () => {
            cy.Post(`/sites/invalid_site/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject create button with site id as negative integer', () => {
            cy.Post(`/sites/-1/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject create button with site id as security payload - ${key}`, () => {
                cy.Post(`/sites/${encodeURIComponent(securityPayloads[key])}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // â”€â”€â”€ Setting Precondition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


    // â”€â”€â”€ Duplicate / Conflict â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Duplicate / Conflict', () => {
        it('should create button with same title and placement as existing button (duplicates allowed)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons('Duplicate Title', placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((firstRes) => {
                expect(firstRes.status).to.eq(200);
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons('Duplicate Title', placementNavbar, null, stylePrimary, null, null, null, 2, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should create button with order value that conflicts with existing button (orders resequenced)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

    });

    // â”€â”€â”€ Type-Content Mismatch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Type-Content Mismatch', () => {
        it('should reject type link but content as element id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, '#section-hero', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });


        it('should reject type scroll but content as plain text', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeScroll, 'plain text', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject type link but content as modal text', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, 'This is some modal text content without a URL', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // â”€â”€â”€ Missing Required Fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Missing Required Fields', () => {
        it('should reject payload without title field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { placement: placementNavbar, button_style: stylePrimary, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject payload without placement field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), button_style: stylePrimary, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.placement[0]).to.eq(messages.instanceButtons.placementRequired);
            });
        });

        it('should reject payload without button_style field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, order: Order, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload without order field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, status: statusUnpublish, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderRequired);
            });
        });

        it('should reject payload without status field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, order: Order, type: typeLink, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });

        it('should reject payload without content field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, order: Order, status: statusUnpublish, type: typeLink },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.content[0]).to.eq(messages.instanceButtons.contentRequired);
            });
        });

        it('should reject payload without type field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8), placement: placementNavbar, button_style: stylePrimary, order: Order, status: statusUnpublish, content: contentUrl },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.type[0]).to.eq(messages.instanceButtons.typeRequired);
            });
        });

        it('should reject payload with only title field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { title: getRandomSubstring(8) },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject empty payload', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                {},
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // â”€â”€â”€ Edge Cases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Edge Cases', () => {
        it('should create button with extra/unexpected fields in payload (extra fields ignored)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                { ...InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null), extra_field: 'unexpected', another_field: 123 },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject create button with all fields as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(null, null, null, null, null, null, null, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject create button with all string fields as whitespace only', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons('   ', '   ', '   ', null, '   ', '   ', '   ', null, null, '   ', '   ', '   '),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for PUT request to POST endpoint', () => {
            cy.request({
                method: 'PUT',
                url: `/sites/${site_id}/instances/${instanceId}/button-resources`,
                body: InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                headers: { Authorization: `Bearer ${Cypress.env('token')}` },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for DELETE request to POST endpoint', () => {
            cy.request({
                method: 'DELETE',
                url: `/sites/${site_id}/instances/${instanceId}/button-resources`,
                headers: { Authorization: `Bearer ${Cypress.env('token')}` },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // â”€â”€â”€ Response Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Response Validation', () => {
        it('should verify success response contains all expected button fields', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, 'fas fa-check', 1, 'test-class', '#ffffff', '#000000', Order, statusUnpublish, typeLink, contentUrl, '{}'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                const body = response.body.body;
                expect(body).to.have.property('id');
                expect(body).to.have.property('title');
                expect(body).to.have.property('placement');
                expect(body).to.have.property('icon');
                expect(body).to.have.property('class_name');
                expect(body).to.have.property('button_style');
                expect(body).to.have.property('text_color');
                expect(body).to.have.property('background_color');
                expect(body).to.have.property('order');
                expect(body).to.have.property('status');
                expect(body).to.have.property('type');
                expect(body).to.have.property('content');
                expect(body).to.have.property('property');
                expect(body).to.have.property('site_id');
            });
        });

        it('should verify error response contains field-specific validation messages', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons('', '', null, null, null, null, null, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.body).to.be.an('object');
            });
        });

        it('should verify button order matches the order value in request via GET after creation', () => {
            const expectedOrder = 3;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, expectedOrder, statusUnpublish, typeLink, contentUrl, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const createdButtonId = response.body.body.id;
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/button-resources/${createdButtonId}`, { failOnStatusCode: false })
                    .then((getResponse) => {
                        expect(getResponse.status).to.eq(200);
                        expect(getResponse.body.body.order).to.eq(expectedOrder);
                    });
            });
        });
    });

    describe('Setting Precondition', () => {
        it('should create button when buttons instance setting is TRUE', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${buttonSettingId}`,
                InputBody.instanceSettings('buttons', true),
                { failOnStatusCode: false }
            ).then((putResponse) => {
                expect(putResponse.status).to.eq(200);
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should reject button creation when buttons instance setting is FALSE', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${buttonSettingId}`,
                InputBody.instanceSettings('buttons', false),
                { failOnStatusCode: false }
            ).then((putResponse) => {
                expect(putResponse.status).to.eq(200);
                cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                    InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${buttonSettingId}`,
                        InputBody.instanceSettings('buttons', true), { failOnStatusCode: false });
                });
            });
        });

        it('should create button after toggling buttons setting from FALSE to TRUE', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${buttonSettingId}`,
                InputBody.instanceSettings('buttons', false),
                { failOnStatusCode: false }
            ).then(() => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${buttonSettingId}`,
                    InputBody.instanceSettings('buttons', true),
                    { failOnStatusCode: false }
                ).then((putResponse) => {
                    expect(putResponse.status).to.eq(200);
                    cy.Post(`/sites/${site_id}/instances/${instanceId}/button-resources`,
                        InputBody.instanceButtons(getRandomSubstring(8), placementNavbar, null, stylePrimary, null, null, null, Order, statusUnpublish, typeLink, contentUrl, null),
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

    });

});
