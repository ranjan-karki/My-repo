import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Update Instance Page Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;

    const publish = 2;
    const unpublish = 1;
    const langEn = 'en';
    const langEs = 'es';
    const Order = 1;

    let instanceId;
    let pageId;
    let existingPageId;
    let deletedInstancePageId;

    before(() => {
        cy.loginAndGetToken();

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), "#123456", "#654321", true, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: 1 }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;

            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Initial Page For Update', status: true },
                { failOnStatusCode: false }
            ).then((pageResponse) => {
                expect(pageResponse.status).to.eq(200);
                pageId = pageResponse.body.body.id;
            });

            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Seed Page For Related ID', status: true },
                { failOnStatusCode: false }
            ).then((seedResponse) => {
                expect(seedResponse.status).to.eq(200);
                existingPageId = seedResponse.body.body.id;
            });
        });

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), "#123456", "#654321", true, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((tempResponse) => {
            expect(tempResponse.status).to.eq(200);
            const tempInstanceId = tempResponse.body.body.id;

            cy.Post(`/sites/${site_id}/instances/${tempInstanceId}/pages`,
                { title: 'Temp Page For Deleted Instance Test', status: true },
                { failOnStatusCode: false }
            ).then((tempPageResponse) => {
                expect(tempPageResponse.status).to.eq(200);
                deletedInstancePageId = tempPageResponse.body.body.id;

                cy.Delete(`/sites/${site_id}/instances/${tempInstanceId}`, { failOnStatusCode: false });
            });
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // ─── Positive Scenarios ──────────────────────────────────────────────────

    describe('Positive Scenarios', () => {
        it('should update page with all valid fields', () => {
            const title = randomAlphaNumeric(10);
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages(title, 'Updated description', unpublish, 'fas fa-edit', 2, 'Updated header', 'Updated footer', langEs, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.body.body.status).to.eq(unpublish);
                expect(response.body.body.lang).to.eq('es');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page title to a new value', () => {
            const newTitle = `Updated_${randomAlphaNumeric(8)}`;
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages(newTitle, null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(newTitle);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page with title at max char limit (255)', () => {
            const title = randomAlphaNumeric(255);
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages(title, null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq(title);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page with title at min char limit (1)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('A', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.title).to.eq('A');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page status from active to inactive (1 to 2)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, unpublish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.status).to.eq(unpublish);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page status from inactive to active (2 to 1)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.status).to.eq(publish);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page lang from "en" to "es"', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, langEs, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.lang).to.eq('es');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page lang from "es" to "en"', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, langEn, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.lang).to.eq('en');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page icon to a new valid class name', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, 'fas fa-star', Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.icon).to.eq('fas fa-star');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page icon to null (remove icon)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page thumbnail_url to a valid URL', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, 'https://example.com/updated-thumb.jpg', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body.thumbnail_url).to.eq('https://example.com/updated-thumb.jpg');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page order to a new positive integer', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, 5, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page header to new HTML content', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, '<nav>Updated Header</nav>', null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page footer to new HTML content', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, '<footer>Updated Footer</footer>', null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page with valid related_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, existingPageId),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page with optional fields as null', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page with description as HTML content', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', '<p>Updated <strong>HTML</strong> description</p>', publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Title Verifications ─────────────────────────────────────────────────

    describe('Title Verifications', () => {
        it('should reject title exceeding max char limit (256)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages(randomAlphaNumeric(256), null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleMax);
            });
        });

        it('should reject title as empty string', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject title as null', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages(null, null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject title as integer type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages(12345, null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleType);
            });
        });

        it('should reject title as max integer (2147483647) - boundary', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages(2147483647, null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should update page with title as security payload - ${key} (input sanitized)`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                    InputBody.instancePages(securityPayloads[key], null, publish, null, Order, null, null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Status Verifications ────────────────────────────────────────────────

    describe('Status Verifications', () => {
        it('should update page with status as integer 1', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, 1, null, 1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject status as integer 0 (valid values are 1 or 2)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, 0, null, 1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
            });
        });

        it('should reject status as null', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, null, null, 1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });

        it('should reject status as empty string', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, '', null, 1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });

        it('should reject status as string "true"', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, 'true', null, 1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
            });
        });

        it('should update page with status as integer 2 (inactive)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, 2, null, 1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Description Verifications ───────────────────────────────────────────

    describe('Description Verifications', () => {
        it('should reject description as integer type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', 12345, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject description as max integer (2147483647) - boundary', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', 2147483647, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject description as extremely long string (100000+ chars)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', randomAlphaNumeric(100001), publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should update page with description as security payload - ${key} (input sanitized)`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                    InputBody.instancePages('Test Page', securityPayloads[key], publish, null, Order, null, null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Icon Verifications ──────────────────────────────────────────────────

    describe('Icon Verifications', () => {
        it('should reject icon as integer type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, 12345, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject icon as max integer (2147483647) - boundary', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, 2147483647, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page with both icon and thumbnail_url in request body', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                { title: 'Test Page', status: true, icon: 'fas fa-home', thumbnail_url: 'https://example.com/thumb.jpg' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should update page with icon as security payload - ${key} (input sanitized)`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                    InputBody.instancePages('Test Page', null, publish, securityPayloads[key], Order, null, null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Thumbnail URL Verifications ─────────────────────────────────────────

    describe('Thumbnail URL Verifications', () => {
        it('should reject invalid thumbnail_url format', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, 'not-a-valid-url', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.thumbnail_url[0]).to.eq(messages.instancePages.thumbnailUrlInvalid);
            });
        });

        it('should reject thumbnail_url as plain text', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, 'plain text', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject thumbnail_url as max integer (2147483647) - boundary', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, 2147483647, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page with both thumbnail_url and icon in request body', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                { title: 'Test Page', status: true, thumbnail_url: 'https://example.com/thumb.jpg', icon: 'fas fa-home' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Order Verifications ─────────────────────────────────────────────────

    describe('Order Verifications', () => {
        it('should reject order as negative integer (-1)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, -1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderMin);
            });
        });

        it('should reject order as string type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, 'first', null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderInteger);
            });
        });

        it('should reject order as decimal (1.5)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, 1.5, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderInteger);
            });
        });

        it('should reject order as max integer (2147483647)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, 2147483647, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as long int exceeding max (9999999999999999)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                { title: 'Test Page', status: true, order: 9999999999999999 },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject order as security payload - ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                    InputBody.instancePages('Test Page', null, publish, null, securityPayloads[key], null, null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Lang Verifications ──────────────────────────────────────────────────

    describe('Lang Verifications', () => {
        it('should reject lang as invalid string ("fr")', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, 'fr', null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.lang[0]).to.eq(messages.instancePages.langInvalid);
            });
        });

        it('should reject lang as "EN" (uppercase) - case sensitive', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, 'EN', null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.lang[0]).to.eq(messages.instancePages.langInvalid);
            });
        });

        it('should update page with lang as empty string (lang is optional)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, '', null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject lang as integer type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, 12345, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject lang as max integer (2147483647) - boundary', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, 2147483647, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Header Verifications ────────────────────────────────────────────────

    describe('Header Verifications', () => {
        it('should reject header as max integer (2147483647) - boundary', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, 2147483647, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page with header as extremely long string (100000+ chars) - boundary', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, randomAlphaNumeric(100001), null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should update page with header as security payload - ${key} (input sanitized)`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                    InputBody.instancePages('Test Page', null, publish, null, Order, securityPayloads[key], null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Footer Verifications ────────────────────────────────────────────────

    describe('Footer Verifications', () => {
        it('should reject footer as large integer (2147483647) - boundary', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, 2147483647, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject footer as extremely long string (100000+ chars)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, randomAlphaNumeric(100001), null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should update page with footer as security payload - ${key} (input sanitized)`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                    InputBody.instancePages('Test Page', null, publish, null, Order, null, securityPayloads[key], null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Related ID Verifications ────────────────────────────────────────────

    describe('Related ID Verifications', () => {
        it('should update page with related_id as null (remove parent)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for related_id from deleted instance', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, deletedInstancePageId),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject related_id as non-existent page id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, 999999),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject related_id as negative integer', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, -1),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.related_id[0]).to.eq(messages.instancePages.relatedIdMin);
            });
        });

        it('should return 404 for related_id as zero (0)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, 0),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject related_id as string type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, 'invalid-id'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.related_id[0]).to.eq(messages.instancePages.relatedIdInteger);
            });
        });

        it('should return 404 for related_id as long int exceeding max (9999999999999999)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                { title: 'Test Page', status: true, related_id: 9999999999999999 },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject related_id as security payload - ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                    InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, securityPayloads[key]),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Page ID Verifications ───────────────────────────────────────────────

    describe('Page ID Verifications', () => {
        it('should reject update with non-existent page_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/999999`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject update with page_id as 0', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/0`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with page_id as negative integer', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/-1`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with page_id as invalid string', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/invalid_id`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page with page_id from same instance (existingPageId)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${existingPageId}`,
                InputBody.instancePages('Cross Instance Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject update with page_id as security payload - ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads[key])}`,
                    InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── URL Path Verifications ──────────────────────────────────────────────

    describe('URL Path Verifications', () => {
        it('should reject update with non-existent site_id', () => {
            cy.Put(`/sites/999999/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject update with deleted site_id', () => {
            cy.Put(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with another reseller site_id', () => {
            cy.Put(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with non-numeric site_id', () => {
            cy.Put(`/sites/invalid_site/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with non-existent instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/999999/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with non-numeric instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/invalid_instance/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject update with site_id as security payload - ${key}`, () => {
                cy.Put(`/sites/${encodeURIComponent(securityPayloads[key])}/instances/${instanceId}/pages/${pageId}`,
                    InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── URL Path Traversal Validations ─────────────────────────────────────

    describe('URL Path Traversal Validations', () => {
        it('should reject path traversal in site_id (../../etc/passwd)', () => {
            cy.Put(`/sites/${encodeURIComponent('../../etc/passwd')}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject URL-encoded path traversal in site_id (%2e%2e%2f)', () => {
            cy.Put(`/sites/%2e%2e%2f/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject double URL-encoded path traversal in site_id (%252e%252e%252f)', () => {
            cy.Put(`/sites/%252e%252e%252f/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal in instance_id (../../etc/passwd)', () => {
            cy.Put(`/sites/${site_id}/instances/${encodeURIComponent('../../etc/passwd')}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject URL-encoded path traversal in instance_id (%2e%2e%2f)', () => {
            cy.Put(`/sites/${site_id}/instances/%2e%2e%2f/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal in page_id (../../etc/passwd)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent('../../etc/passwd')}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal security payload in site_id', () => {
            cy.Put(`/sites/${encodeURIComponent(securityPayloads.pathTraversal)}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal security payload in page_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads.pathTraversal)}`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Authorization Verifications ─────────────────────────────────────────

    describe('Authorization Verifications', () => {
        it('should reject update without authentication token', () => {
            cy.request({
                method: 'PUT',
                url: `/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                body: InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with invalid authentication token', () => {
            cy.request({
                method: 'PUT',
                url: `/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                body: InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                headers: { Authorization: 'Bearer invalid_token_value' },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with malformed authorization header', () => {
            cy.request({
                method: 'PUT',
                url: `/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                body: InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                headers: { Authorization: 'NotBearer sometoken' },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Edge Cases ──────────────────────────────────────────────────────────

    describe('Edge Cases', () => {
        it('should reject empty payload', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                {},
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload with all fields as null', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages(null, null, null, null, null, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update page with extra/unexpected fields in payload (extra fields ignored)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                { ...InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null), extra_field: 'unexpected', another_field: 123 },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for POST request to the update endpoint', () => {
            cy.request({
                method: 'POST',
                url: `/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                body: InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, null),
                headers: { Authorization: `Bearer ${Cypress.env('token')}` },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Response Validation ─────────────────────────────────────────────────

    describe('Response Validation', () => {
        it('should verify success response contains all expected page fields', () => {
            const title = `Response Check ${randomAlphaNumeric(5)}`;
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages(title, 'Updated desc', publish, 'fas fa-check', 3, 'Header', 'Footer', langEn, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                const body = response.body.body;
                expect(body).to.have.property('id');
                expect(body).to.have.property('title');
                expect(body).to.have.property('description');
                expect(body).to.have.property('status');
                expect(body).to.have.property('icon');
                expect(body).to.have.property('order');
                expect(body).to.have.property('header');
                expect(body).to.have.property('footer');
                expect(body).to.have.property('lang');
                expect(body.title).to.eq(title);
                expect(body.id).to.eq(pageId);
            });
        });

        it('should verify error response contains field-specific validation messages', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                { title: '', status: null },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.body).to.be.an('object');
            });
        });

        it('should verify updated values are persisted via GET after update', () => {
            const updatedTitle = `Persisted_${randomAlphaNumeric(6)}`;
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`,
                InputBody.instancePages(updatedTitle, null, unpublish, null, Order, null, null, langEs, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}`, { failOnStatusCode: false })
                    .then((getResponse) => {
                        expect(getResponse.status).to.eq(200);
                        expect(getResponse.body.body.title).to.eq(updatedTitle);
                        expect(getResponse.body.body.status).to.eq(1);
                        expect(getResponse.body.body.lang).to.eq('es');
                    });
            });
        });
    });
});
