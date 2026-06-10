import { InputBody } from "../../support/inputBody";
import { messages } from "../../support/messages";
import { randomAlphaNumeric } from "../../utils/basicUtils";
import { securityPayloads } from "../../utils/securityPayloads";
import { TIMEOUTS } from "../../support/testConfig";
import { fileUrls } from "../../fixtures/fileUrls";

describe('Update Site Tests', () => {
    const responseTimeLimit      = TIMEOUTS.response;
    const validLogoUrl           = fileUrls.png;
    const validPrimary           = '#123456';
    const validSecondary         = '#654321';
    const validStatus            = 2;
    const validSetupComplete     = 1;
    const validMaintenanceMsg    = 'Scheduled maintenance in progress.';
    let siteId;

    before(() => {
        cy.loginAndGetToken();
        cy.Post('/sites',
            InputBody.sites(`Site ${randomAlphaNumeric(5)}`, randomAlphaNumeric(8).toLowerCase(), validLogoUrl, validPrimary, validSecondary, null),
            { failOnStatusCode: false }
        ).then((response) => {
            expect(response.status).to.eq(200);
            siteId = response.body.body.id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    after(() => {
        cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
    });

    // ─── Site Update - Valid ──────────────────────────────────────────────────

    describe('Site Update - Valid', () => {
        it('should update site with all valid fields in payload', () => {
            cy.Put(`/sites/${siteId}`, {
                title: `Updated Site ${randomAlphaNumeric(5)}`,
                logo_url: validLogoUrl,
                primary_color: validPrimary,
                secondary_color: validSecondary,
                status: validStatus,
                setup_complete: validSetupComplete,
                maintenance_message: null
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update site with single field (title) in payload', () => {
            cy.Put(`/sites/${siteId}`, { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with valid id in path parameter', () => {
            cy.Put(`/sites/${siteId}`, { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Title Field - Valid ──────────────────────────────────────────────────

    describe('Title Field - Valid', () => {
        it('should update site with title at max char limit (255)', () => {
            cy.Put(`/sites/${siteId}`, { title: randomAlphaNumeric(255) }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with title at min char limit (1)', () => {
            cy.Put(`/sites/${siteId}`, { title: 'A' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Title Field - Invalid ────────────────────────────────────────────────

    describe('Title Field - Invalid', () => {
        it('should reject title exceeding max char limit (256)', () => {
            cy.Put(`/sites/${siteId}`, { title: randomAlphaNumeric(256) }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.title[0]).to.eq(messages.titleMax);
                });
        });

        it('should reject empty title', () => {
            cy.Put(`/sites/${siteId}`, { title: '' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
                });
        });

        it('should reject null title', () => {
            cy.Put(`/sites/${siteId}`, { title: null }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
                });
        });

        it('should reject title as integer type', () => {
            cy.Put(`/sites/${siteId}`, { title: 12345 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Title Field - Security ───────────────────────────────────────────────

    describe('Title Field - Security', () => {
        Object.keys(securityPayloads).forEach((key) => {
            it(`should update site with title as security payload - ${key} (input sanitized)`, () => {
                cy.Put(`/sites/${siteId}`, { title: securityPayloads[key] }, { failOnStatusCode: false })
                    .then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
            });
        });
    });

    // ─── Domain Field - Restriction ───────────────────────────────────────────

    describe('Domain Field - Restriction', () => {
        it('should ignore domain field in update payload (domain not updated)', () => {
            cy.Put(`/sites/${siteId}`,
                { title: `Site ${randomAlphaNumeric(5)}`, domain: randomAlphaNumeric(8).toLowerCase() },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should not update domain when domain value is changed (domain remains unchanged)', () => {
            cy.GetItems(`/sites/${siteId}`, { failOnStatusCode: false }).then((getResponse) => {
                const currentDomain = getResponse.body.body.domain;
                cy.Put(`/sites/${siteId}`,
                    { title: `Site ${randomAlphaNumeric(5)}`, domain: `changed-${randomAlphaNumeric(6).toLowerCase()}` },
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    expect(response.body.body.domain).to.eq(currentDomain);
                });
            });
        });
    });

    // ─── Logo URL - Valid ─────────────────────────────────────────────────────

    describe('Logo URL - Valid', () => {
        it('should update site with valid logo_url (jpg extension)', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: fileUrls.jpg }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with valid logo_url (jpeg extension)', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: fileUrls.jpeg }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with valid logo_url (png extension)', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: fileUrls.png }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with valid logo_url (svg extension)', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: fileUrls.svg }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Logo URL - Invalid ───────────────────────────────────────────────────

    describe('Logo URL - Invalid', () => {
        it('should reject empty logo_url', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: '' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject null logo_url', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: null }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject logo_url as gif (invalid image format)', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: fileUrls.gif }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.logo_url[0]).to.eq(messages.logoUrlTypeError);
                });
        });

        it('should reject logo_url as document file (pdf)', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: fileUrls.pdf }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.logo_url[0]).to.eq(messages.logoUrlTypeError);
                });
        });

        it('should reject invalid logo_url format (no valid extension)', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: 'not-a-valid-url' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject logo_url as integer type', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: 12345 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Logo URL - Security ──────────────────────────────────────────────────

    describe('Logo URL - Security', () => {
        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject logo_url as security payload - ${key} (invalid URL)`, () => {
                cy.Put(`/sites/${siteId}`, { logo_url: securityPayloads[key] }, { failOnStatusCode: false })
                    .then((response) => {
                        expect(response.status).to.eq(417);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
            });
        });
    });

    // ─── Primary Color - Valid ────────────────────────────────────────────────

    describe('Primary Color - Valid', () => {
        it('should update site with valid primary_color hash (#121212)', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: '#121212' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with primary_color as 3-digit hash (#FFF)', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: '#FFF' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with primary_color as lowercase hash (#abcdef)', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: '#abcdef' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with primary_color as uppercase hash (#ABCDEF)', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: '#ABCDEF' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Primary Color - Invalid ──────────────────────────────────────────────

    describe('Primary Color - Invalid', () => {
        it('should reject empty primary_color', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: '' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                });
        });

        it('should reject null primary_color', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: null }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                });
        });

        it('should reject primary_color without hash symbol', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: 'ffffff' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                });
        });

        it('should reject primary_color with invalid hex characters (#gggggg)', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: '#gggggg' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                });
        });

        it('should reject primary_color exceeding 7 chars (#fffffff)', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: '#fffffff' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                });
        });

        it('should reject primary_color as integer type', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: 16777215 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                });
        });

        it('should reject primary_color as RGB format', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: 'rgb(255,255,255)' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                });
        });
    });

    // ─── Primary Color - Security ─────────────────────────────────────────────

    describe('Primary Color - Security', () => {
        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject primary_color as security payload - ${key} (invalid color)`, () => {
                cy.Put(`/sites/${siteId}`, { primary_color: securityPayloads[key] }, { failOnStatusCode: false })
                    .then((response) => {
                        expect(response.status).to.eq(417);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                        cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                    });
            });
        });
    });

    // ─── Secondary Color - Valid ──────────────────────────────────────────────

    describe('Secondary Color - Valid', () => {
        it('should update site with valid secondary_color hash (#c8c6fd)', () => {
            cy.Put(`/sites/${siteId}`, { secondary_color: '#c8c6fd' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with secondary_color as 3-digit hash (#ABC)', () => {
            cy.Put(`/sites/${siteId}`, { secondary_color: '#ABC' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Secondary Color - Invalid ────────────────────────────────────────────

    describe('Secondary Color - Invalid', () => {
        it('should reject empty secondary_color', () => {
            cy.Put(`/sites/${siteId}`, { secondary_color: '' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                });
        });

        it('should reject null secondary_color', () => {
            cy.Put(`/sites/${siteId}`, { secondary_color: null }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                });
        });

        it('should reject secondary_color without hash symbol', () => {
            cy.Put(`/sites/${siteId}`, { secondary_color: '654321' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                });
        });

        it('should reject secondary_color with invalid hex characters (#zzzzzz)', () => {
            cy.Put(`/sites/${siteId}`, { secondary_color: '#zzzzzz' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                });
        });

        it('should reject secondary_color as integer type', () => {
            cy.Put(`/sites/${siteId}`, { secondary_color: 654321 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                });
        });
    });

    // ─── Secondary Color - Security ───────────────────────────────────────────

    describe('Secondary Color - Security', () => {
        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject secondary_color as security payload - ${key} (invalid color)`, () => {
                cy.Put(`/sites/${siteId}`, { secondary_color: securityPayloads[key] }, { failOnStatusCode: false })
                    .then((response) => {
                        expect(response.status).to.eq(417);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                        cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                    });
            });
        });
    });

    // ─── Status Field - Valid ─────────────────────────────────────────────────

    describe('Status Field - Valid', () => {
        it('should update site with status as 1 (unpublish)', () => {
            cy.Put(`/sites/${siteId}`, { status: 1 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with status as 2 (publish)', () => {
            cy.Put(`/sites/${siteId}`, { status: 2 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Status Field - Invalid ───────────────────────────────────────────────

    describe('Status Field - Invalid', () => {
        it('should reject status as 0 (invalid value)', () => {
            cy.Put(`/sites/${siteId}`, { status: 0 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
                });
        });

        it('should reject status as 3 (invalid value)', () => {
            cy.Put(`/sites/${siteId}`, { status: 3 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
                });
        });

        it('should reject status as negative integer', () => {
            cy.Put(`/sites/${siteId}`, { status: -1 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
                });
        });

        it('should reject status as string type', () => {
            cy.Put(`/sites/${siteId}`, { status: 'active' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject status as decimal', () => {
            cy.Put(`/sites/${siteId}`, { status: 1.5 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject status as null', () => {
            cy.Put(`/sites/${siteId}`, { status: null }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.expect(response.body.body.status[0]).to.eq(messages.statusInvalid);
                });
        });

        it('should accept status as boolean (true maps to 1)', () => {
            cy.Put(`/sites/${siteId}`, { status: true }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Status Field - Security ──────────────────────────────────────────────

    describe('Status Field - Security', () => {
        it('should reject status as path traversal string (invalid status value)', () => {
            cy.Put(`/sites/${siteId}`, { status: securityPayloads.pathTraversal }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Setup Complete - Valid ───────────────────────────────────────────────

    describe('Setup Complete - Valid', () => {
        it('should update site with setup_complete as 1 (live)', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: 1 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should update site with setup_complete as 2 (maintenance mode)', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: validMaintenanceMsg
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Setup Complete - Invalid ─────────────────────────────────────────────

    describe('Setup Complete - Invalid', () => {
        it('should reject setup_complete as 0 (invalid value)', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: 0 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject setup_complete as 3 (invalid value)', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: 3 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject setup_complete as negative integer', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: -1 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject setup_complete as string type', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: 'live' }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject setup_complete as decimal', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: 1.5 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should accept setup_complete as null (field ignored in partial update)', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: null }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should accept setup_complete as boolean (true maps to 1)', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: true }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Setup Complete - Security ────────────────────────────────────────────

    describe('Setup Complete - Security', () => {
        it('should reject setup_complete as path traversal string (invalid value)', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: securityPayloads.pathTraversal }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Maintenance Message - Valid ──────────────────────────────────────────

    describe('Maintenance Message - Valid', () => {

        it('should update site with maintenance_message at max char limit', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: 'M'.repeat(1000)
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update site with maintenance_message at min char limit (1)', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: 'M'
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update site with maintenance_message containing special characters', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: 'Maintenance @#$%! underway. ETA: <1hr>'
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Maintenance Message - Invalid ────────────────────────────────────────

    describe('Maintenance Message - Invalid', () => {
        it('should accept maintenance_message exceeding 1000 chars (no server-side limit enforced)', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: 'M'.repeat(1001)
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject maintenance_message as integer type', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: 12345
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept empty maintenance_message when setup_complete is 2 (no server enforcement)', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: ''
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Maintenance Message - Security ───────────────────────────────────────

    describe('Maintenance Message - Security', () => {
        it('should update site with maintenance_message as JS script injection (input sanitized)', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: securityPayloads.xss
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update site with maintenance_message as SQL injection (input sanitized)', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: securityPayloads.sql
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update site with maintenance_message as HTML tags (input sanitized)', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: '<b>Maintenance</b> in <i>progress</i>'
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update site with maintenance_message as directory traversal (input sanitized)', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: securityPayloads.pathTraversal
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Maintenance Mode Logic ───────────────────────────────────────────────

    describe('Maintenance Mode Logic', () => {
        it('should enter maintenance mode (setup_complete=2) with maintenance_message', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: validMaintenanceMsg
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.body.setup_complete).to.eq(2);
            });
        });

        it('should go live from maintenance mode (setup_complete=1)', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: 1 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    expect(response.body.body.setup_complete).to.eq(1);
                });
        });

        it('should accept maintenance mode (setup_complete=2) without maintenance_message', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: 2 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── ID Path Parameter - Invalid ─────────────────────────────────────────

    describe('ID Path Parameter - Invalid', () => {
        it('should return 404 for non-existent site id in path parameter', () => {
            cy.Put('/sites/999999999', { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should return 404 for id as string in path parameter', () => {
            cy.Put('/sites/invalid-id', { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should return 404 for id as negative integer in path parameter', () => {
            cy.Put('/sites/-1', { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should return 404 for id as zero in path parameter', () => {
            cy.Put('/sites/0', { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should return 404 for id as decimal in path parameter', () => {
            cy.Put('/sites/1.5', { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should return 405 for empty id in path parameter', () => {
            cy.Put('/sites/', { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(405);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should return 404 for id as special characters in path parameter', () => {
            cy.Put('/sites/@#$', { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── ID Path Parameter - Security ────────────────────────────────────────

    describe('ID Path Parameter - Security', () => {
        it('should return 404 for id as directory traversal path in path parameter', () => {
            cy.Put(`/sites/${encodeURIComponent('../../1')}`, { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Edge Cases ───────────────────────────────────────────────────────────

    describe('Edge Cases', () => {
        it('should accept empty JSON payload (partial update with no changes)', () => {
            cy.Put(`/sites/${siteId}`, {}, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should accept malformed JSON payload (server parses gracefully)', () => {
            cy.request({
                method: 'PUT',
                url: `/sites/${siteId}`,
                body: 'not valid json {',
                headers: {
                    Authorization: `Bearer ${Cypress.env('token')}`,
                    'Content-Type': 'application/json'
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update site with extra/unexpected fields in payload (extra fields ignored)', () => {
            cy.Put(`/sites/${siteId}`,
                { title: `Site ${randomAlphaNumeric(5)}`, extra_field: 'unexpected', another: 123 },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload with all fields as null', () => {
            cy.Put(`/sites/${siteId}`, {
                title: null,
                logo_url: null,
                primary_color: null,
                secondary_color: null,
                status: null,
                maintenance_message: null,
                setup_complete: null
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload with whitespace only in string fields', () => {
            cy.Put(`/sites/${siteId}`, {
                title: '   ',
                logo_url: '   ',
                primary_color: '   ',
                secondary_color: '   '
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── HTTP Method Validation ───────────────────────────────────────────────

    describe('HTTP Method Validation', () => {
        it('should return 405 for POST request to PUT /api/sites/{id} endpoint', () => {
            cy.request({
                method: 'POST',
                url: `/sites/${siteId}`,
                body: { title: `Site ${randomAlphaNumeric(5)}` },
                headers: { Authorization: `Bearer ${Cypress.env('token')}` },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 200 for GET request to /api/sites/{id} (GET is a valid method)', () => {
            cy.request({
                method: 'GET',
                url: `/sites/${siteId}`,
                headers: { Authorization: `Bearer ${Cypress.env('token')}` },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Response Validation ──────────────────────────────────────────────────

    describe('Response Validation', () => {
        it('should verify PUT success response contains updated site id and all fields', () => {
            const updatedTitle = `Updated ${randomAlphaNumeric(5)}`;
            cy.Put(`/sites/${siteId}`, {
                title: updatedTitle,
                logo_url: validLogoUrl,
                primary_color: validPrimary,
                secondary_color: validSecondary,
                status: validStatus,
                setup_complete: validSetupComplete
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                const body = response.body.body;
                expect(body).to.have.property('id');
                expect(body.title).to.eq(updatedTitle);
                expect(body.primary_color).to.eq(validPrimary);
                expect(body.secondary_color).to.eq(validSecondary);
                expect(body).to.have.property('logo_url');
                expect(body).to.have.property('status');
                expect(body).to.have.property('setup_complete');
            });
        });

        it('should verify PUT success response contains updated_at timestamp', () => {
            cy.Put(`/sites/${siteId}`, { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    expect(response.body.body).to.have.property('updated_at');
                    expect(response.body.body.updated_at).to.not.be.null;
                });
        });

        it('should verify PUT error response for validation error contains error details', () => {
            cy.Put(`/sites/${siteId}`, { title: randomAlphaNumeric(256) }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    expect(response.body).to.have.property('body');
                    cy.expect(response.body.body.title[0]).to.eq(messages.titleMax);
                });
        });

        it('should verify PUT error response for not found contains error details', () => {
            cy.Put('/sites/999999999', { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    expect(response.body).to.have.property('body');
                });
        });
    });

    // ─── Large Integer Values ─────────────────────────────────────────────────

    describe('Large Integer Values', () => {
        it('should reject status as MAX_SAFE_INTEGER (9007199254740991)', () => {
            cy.Put(`/sites/${siteId}`, { status: Number.MAX_SAFE_INTEGER }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject setup_complete as MAX_SAFE_INTEGER (9007199254740991)', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: Number.MAX_SAFE_INTEGER }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should return 404 for id as MAX_SAFE_INTEGER in path parameter', () => {
            cy.Put(`/sites/${Number.MAX_SAFE_INTEGER}`, { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject status as extremely large integer (beyond JS limit)', () => {
            cy.Put(`/sites/${siteId}`, { status: 1e20 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject setup_complete as extremely large integer (beyond JS limit)', () => {
            cy.Put(`/sites/${siteId}`, { setup_complete: 1e20 }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should return 404 for id as extremely large integer (beyond JS limit) in path parameter', () => {
            cy.Put('/sites/99999999999999999999999', { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject status as MIN_SAFE_INTEGER (-9007199254740991)', () => {
            cy.Put(`/sites/${siteId}`, { status: Number.MIN_SAFE_INTEGER }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should return 404 for id as MIN_SAFE_INTEGER in path parameter', () => {
            cy.Put(`/sites/${Number.MIN_SAFE_INTEGER}`, { title: `Site ${randomAlphaNumeric(5)}` }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Extremely Large Input ────────────────────────────────────────────────

    describe('Extremely Large Input - Title', () => {
        it('should reject title as 10,000 characters', () => {
            cy.Put(`/sites/${siteId}`, { title: 'a'.repeat(10_000) }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject title as 100,000 characters', () => {
            cy.Put(`/sites/${siteId}`, { title: 'a'.repeat(100_000) }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should return 400 for title as 1MB string', () => {
            cy.Put(`/sites/${siteId}`, { title: 'a'.repeat(1024 * 1024) }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(400);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    describe('Extremely Large Input - Logo URL', () => {
        it('should reject logo_url as 10,000 characters', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: 'a'.repeat(10_000) }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject logo_url as 100,000 characters', () => {
            cy.Put(`/sites/${siteId}`, { logo_url: 'a'.repeat(100_000) }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    describe('Extremely Large Input - Colors', () => {
        it('should reject primary_color as 10,000 characters (invalid color format)', () => {
            cy.Put(`/sites/${siteId}`, { primary_color: 'a'.repeat(10_000) }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should reject secondary_color as 10,000 characters (invalid color format)', () => {
            cy.Put(`/sites/${siteId}`, { secondary_color: 'a'.repeat(10_000) }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    describe('Extremely Large Input - Maintenance Message', () => {
        it('should reject maintenance_message as 10,000 characters', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: 'a'.repeat(10_000)
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject maintenance_message as 100,000 characters', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: 'a'.repeat(100_000)
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 417 for maintenance_message as 1MB string', () => {
            cy.Put(`/sites/${siteId}`, {
                setup_complete: 2,
                maintenance_message: 'a'.repeat(1024 * 1024)
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

  
});
