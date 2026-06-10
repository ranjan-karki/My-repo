import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Add Instance Page Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;

    const publish = 2;
    const unpublish = 1;
    const langEn = 'en';
    const langEs = 'es';
    const iconHome = 'fas fa-home';
    const Order = 1;

    let instanceId;
    let existingPageId;
    let deletedInstancePageId;

    before(() => {
        cy.loginAndGetToken();

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), "#123456", "#654321", true, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;

            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Seed Page For RelatedId', status: true },
                { failOnStatusCode: false }
            ).then((pageResponse) => {
                expect(pageResponse.status).to.eq(200);
                existingPageId = pageResponse.body.body.id;
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

    // ─── Positive Scenarios ─────────────────────────────────────────────────

    describe('Positive Scenarios', () => {
        it('should create page with all valid fields in payload', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('All Fields Page', 'A valid description', publish, iconHome, Order, 'Header text', 'Footer text', langEn, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with mandatory fields only (title, status) in payload', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Mandatory Only Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Title Field Verifications ───────────────────────────────────────────

    describe('Title Field Verifications', () => {
        it('should create page with title at max char limit (255)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages(randomAlphaNumeric(255), null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with title at min char limit (1)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('A', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject title exceeding max char limit (256)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages(randomAlphaNumeric(256), null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleMax);
            });
        });

        it('should reject title as empty string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject title as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages(null, null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject title as integer type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages(12345, null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleType);
            });
        });

        it('should reject payload without title field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
            });
        });

        it('should reject title as extremely long string (10000+ chars)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages(randomAlphaNumeric(10001), null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleMax);
            });
        });

        it('should reject title as max integer value (2147483647) - boundary', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages(2147483647, null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with title as special characters', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('!@#$%^&*()-_=+[]{}|;:,./<>?', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should create page with title as security payload - ${key} (input sanitized)`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                    InputBody.instancePages(securityPayloads[key], null, publish, null, Order, null, null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Status Field Verifications ──────────────────────────────────────────

    describe('Status Field Verifications', () => {
        it('should create page with status as published', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Status True Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });


        it('should create page with status as integer 1', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Status Int 1 Page', null, 1, null, 1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject status as integer 0 (valid values are 1 or 2)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Status Int 0 Page', null, 0, null, 1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
            });
        });

        it('should reject status as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, null, null, 1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });

        it('should reject status as empty string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, '', null, 1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });

        it('should reject payload without status field', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Test Page' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.status[0]).to.eq(messages.statusRequired);
            });
        });
    });

    // ─── Description Field Verifications ────────────────────────────────────

    describe('Description Field Verifications', () => {
        it('should create page with valid description text', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', 'A valid description text', publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with description as long text', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', randomAlphaNumeric(5000), publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with description as HTML content', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', '<p>This is <strong>HTML</strong> content</p>', publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject description as integer type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', 12345, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject description as extremely long string (100000+ chars)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', randomAlphaNumeric(100001), publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject description as max integer (2147483647) - boundary', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', 2147483647, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should create page with description as security payload - ${key} (input sanitized)`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                    InputBody.instancePages('Test Page', securityPayloads[key], publish, null, Order, null, null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Icon Field Verifications ────────────────────────────────────────────

    describe('Icon Field Verifications', () => {
        it('should create page with valid icon class name', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, iconHome, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with icon only (no thumbnail_url)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Icon Only Page', status: true, icon: 'fas fa-star' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with both icon and thumbnail_url in request body', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Mutual Exclusive Test', status: true, icon: 'fas fa-home', thumbnail_url: 'https://example.com/thumb.jpg' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject icon as extremely long string (10000+ chars)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, randomAlphaNumeric(10001), Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject icon as max integer (2147483647) - boundary', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, 2147483647, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject icon as integer type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, 12345, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Thumbnail URL Field Verifications ───────────────────────────────────

    describe('Thumbnail URL Field Verifications', () => {
        it('should create page with valid thumbnail_url', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, 'https://example.com/thumb.jpg', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with thumbnail_url only (no icon)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Thumbnail Only Page', status: true, thumbnail_url: 'https://example.com/image.png' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject invalid thumbnail_url format (not a URL)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, 'not-a-valid-url', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.thumbnail_url[0]).to.eq(messages.instancePages.thumbnailUrlInvalid);
            });
        });

        it('should reject thumbnail_url as plain text', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, 'plain text', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject thumbnail_url as extremely long URL (10000+ chars)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, `https://example.com/${randomAlphaNumeric(9990)}`, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject thumbnail_url as max integer (2147483647) - boundary', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, 2147483647, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with both thumbnail_url and icon in request body', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true, thumbnail_url: 'https://example.com/thumb.jpg', icon: 'fas fa-home' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Order Field Verifications ───────────────────────────────────────────

    describe('Order Field Verifications', () => {
        it('should create page with order as positive integer (1)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Order 1 Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with order as large positive integer (999)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Order 999 Page', null, publish, null, 999, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as negative integer (-1)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, -1, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderMin);
            });
        });

        it('should reject order as max integer (2147483647)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Max Int Order Page', null, publish, null, 2147483647, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as long int exceeding max (9999999999999999)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true, order: 9999999999999999 },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, 'first', null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderInteger);
            });
        });

        it('should reject order as decimal number (1.5)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, 1.5, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderInteger);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject order as security payload - ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                    InputBody.instancePages('Test Page', null, publish, null, securityPayloads[key], null, null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Lang Field Verifications ────────────────────────────────────────────

    describe('Lang Field Verifications', () => {
        it('should create page with lang as "en"', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Lang EN Page', null, publish, null, Order, null, null, langEn, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with lang as "es"', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Lang ES Page', null, publish, null, Order, null, null, langEs, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject lang as invalid string ("fr")', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, 'fr', null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.lang[0]).to.eq(messages.instancePages.langInvalid);
            });
        });

        it('should reject lang as "EN" (uppercase) - case sensitive', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, 'EN', null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.lang[0]).to.eq(messages.instancePages.langInvalid);
            });
        });

        it('should create page with lang as empty string (lang is optional)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, '', null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject lang as integer type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, 12345, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject lang as extremely long string (10000+ chars)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, randomAlphaNumeric(10001), null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject lang as max integer (2147483647) - boundary', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, 2147483647, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Header Field Verifications ──────────────────────────────────────────

    describe('Header Field Verifications', () => {
        it('should create page with valid header text', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, 'Header Content', null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with header as HTML content', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, '<nav><a href="#">Home</a></nav>', null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with header as extremely long string (100000+ chars) - boundary', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, randomAlphaNumeric(100001), null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject header as max integer (2147483647) - boundary', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, 2147483647, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should create page with header as security payload - ${key} (input sanitized)`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                    InputBody.instancePages('Test Page', null, publish, null, Order, securityPayloads[key], null, null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Footer Field Verifications ──────────────────────────────────────────

    describe('Footer Field Verifications', () => {
        it('should create page with valid footer text', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, 'Footer Content', null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with footer as HTML content', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, '<footer><p>Footer</p></footer>', null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with footer as extremely long string (100000+ chars) - boundary', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, randomAlphaNumeric(100001), null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect([200, 417]).to.include(response.status);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject footer as large integer (2147483647) - boundary', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, 2147483647, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should create page with footer as security payload - ${key} (input sanitized)`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                    InputBody.instancePages('Test Page', null, publish, null, Order, null, securityPayloads[key], null, null, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Related ID Field Verifications ─────────────────────────────────────

    describe('Related ID Field Verifications', () => {
        it('should create page with valid related_id (existing page id from same instance)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Related Page', null, publish, null, Order, null, null, null, null, existingPageId),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with related_id as null (no parent page)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('No Parent Page', null, publish, null, Order, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for related_id from deleted instance', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, deletedInstancePageId),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject related_id as non-existent page id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, 999999),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject related_id as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, -1),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.related_id[0]).to.eq(messages.instancePages.relatedIdMin);
            });
        });

        it('should reject related_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, 'invalid-id'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.related_id[0]).to.eq(messages.instancePages.relatedIdInteger);
            });
        });

        it('should return 404 for related_id as long int exceeding max (9999999999999999)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true, related_id: 9999999999999999 },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for related_id as zero (0)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, 0),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject related_id as security payload - ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                    InputBody.instancePages('Test Page', null, publish, null, Order, null, null, null, null, securityPayloads[key]),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── URL Path Verifications ──────────────────────────────────────────────

    describe('URL Path Verifications', () => {
        it('should reject page creation with non-existent site_id', () => {
            cy.Post(`/sites/999999/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject page creation with deleted site_id', () => {
            cy.Post(`/sites/${deleted_site}/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject page creation with another reseller site_id', () => {
            cy.Post(`/sites/${another_reseller_site}/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject page creation with non-numeric site_id', () => {
            cy.Post(`/sites/invalid_site/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject page creation with negative site_id', () => {
            cy.Post(`/sites/-1/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject page creation with non-existent instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/999999/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject page creation with non-numeric instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/invalid_instance/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject page creation with negative instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/-1/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── URL Path Traversal Validations (Missing from CSV - added) ───────────

    describe('URL Path Traversal Validations', () => {
        it('should reject path traversal attempt in site_id (../)', () => {
            cy.Post(`/sites/${encodeURIComponent('../')}/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal attempt in site_id (../../etc/passwd)', () => {
            cy.Post(`/sites/${encodeURIComponent('../../etc/passwd')}/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject URL-encoded path traversal in site_id (%2e%2e%2f)', () => {
            cy.Post(`/sites/%2e%2e%2f/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject double URL-encoded path traversal in site_id (%252e%252e%252f)', () => {
            cy.Post(`/sites/%252e%252e%252f/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal attempt in instance_id (../)', () => {
            cy.Post(`/sites/${site_id}/instances/${encodeURIComponent('../')}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal attempt in instance_id (../../etc/passwd)', () => {
            cy.Post(`/sites/${site_id}/instances/${encodeURIComponent('../../etc/passwd')}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject URL-encoded path traversal in instance_id (%2e%2e%2f)', () => {
            cy.Post(`/sites/${site_id}/instances/%2e%2e%2f/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal security payload in site_id', () => {
            cy.Post(`/sites/${encodeURIComponent(securityPayloads.pathTraversal)}/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject path traversal security payload in instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/${encodeURIComponent(securityPayloads.pathTraversal)}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 400 for null byte injection in site_id path', () => {
            cy.Post(`/sites/${encodeURIComponent(`${site_id}\x00`)}/instances/${instanceId}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 400 for null byte injection in instance_id path', () => {
            cy.Post(`/sites/${site_id}/instances/${encodeURIComponent(`${instanceId}\x00`)}/pages`,
                { title: 'Test Page', status: true },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Authorization Verifications ─────────────────────────────────────────

    describe('Authorization Verifications', () => {
        it('should reject page creation without authentication token', () => {
            cy.request({
                method: 'POST',
                url: `/sites/${site_id}/instances/${instanceId}/pages`,
                body: { title: 'Test Page', status: true },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject page creation with invalid authentication token', () => {
            cy.request({
                method: 'POST',
                url: `/sites/${site_id}/instances/${instanceId}/pages`,
                body: { title: 'Test Page', status: true },
                headers: { Authorization: 'Bearer invalid_token_value' },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject page creation with malformed authorization header', () => {
            cy.request({
                method: 'POST',
                url: `/sites/${site_id}/instances/${instanceId}/pages`,
                body: { title: 'Test Page', status: true },
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
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                {},
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload with all fields as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages(null, null, null, null, null, null, null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should create page with extra/unexpected fields in payload (extra fields ignored)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { ...InputBody.instancePages('Extra Fields Page', null, publish, null, Order, null, null, null, null, null), extra_field: 'unexpected', another_field: 123 },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for PUT request to the pages POST endpoint', () => {
            cy.request({
                method: 'PUT',
                url: `/sites/${site_id}/instances/${instanceId}/pages`,
                body: { title: 'Test Page', status: true },
                headers: { Authorization: `Bearer ${Cypress.env('token')}` },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for DELETE request to the pages POST endpoint', () => {
            cy.request({
                method: 'DELETE',
                url: `/sites/${site_id}/instances/${instanceId}/pages`,
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
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Response Validation Page', 'A description', publish, 'fas fa-check', Order, 'Header', 'Footer', langEn, null, null),
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
            });
        });

        it('should verify error response contains field-specific validation messages', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: '', status: null },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.body).to.be.an('object');
            });
        });

        it('should verify created page is retrievable via GET after creation', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                InputBody.instancePages('Retrievable Page', null, publish, null, 2, null, null, langEn, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const createdPageId = response.body.body.id;
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${createdPageId}`, { failOnStatusCode: false })
                    .then((getResponse) => {
                        expect(getResponse.status).to.eq(200);
                        expect(getResponse.body.body.id).to.eq(createdPageId);
                        expect(getResponse.body.body.title).to.eq('Retrievable Page');
                    });
            });
        });
    });
});
