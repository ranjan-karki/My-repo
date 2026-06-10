import { InputBody } from "../../support/inputBody";
import { messages } from "../../support/messages";
import { randomAlphaNumeric } from "../../utils/basicUtils";
import { securityPayloads } from "../../utils/securityPayloads";
import { THEMES, TIMEOUTS } from "../../support/testConfig";
import { fileUrls } from "../../fixtures/fileUrls";

describe('Create Site Tests', () => {
    const responseTimeLimit = TIMEOUTS.response;
    let layout         = THEMES.theme1;
    
    let primaryColor   = '#123456';
    let secondaryColor = '#654321';
    let title;
    let domain;
    let logoUrl;

    beforeEach(() => {
        cy.loginAndGetToken();
        title          = `Site ${randomAlphaNumeric(5)}`;
        domain         = randomAlphaNumeric(8).toLowerCase();
        logoUrl        = fileUrls.png;        
        
    });

    // ─── Positive Scenarios ───────────────────────────────────────────────────

    describe('Positive Scenarios', () => {
        it('should create site with all valid fields and verify default instance is created', () => {
            cy.Post('/sites', InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const body = response.body.body;
                expect(body).to.have.property('default_instance_id');
                expect(body.default_instance_id).to.be.a('number');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${body.id}`, { failOnStatusCode: false });
            });
        });

        it('should create site with mandatory fields only', () => {
            layout = null;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });
    });

    // ─── Title Verifications ──────────────────────────────────────────────────

    describe('Title Verifications', () => {
        it('should create site with title at max char limit (255)', () => {
            title = randomAlphaNumeric(255);
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with title at min char limit (1)', () => {
            title = 'A';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should reject title exceeding max char limit (256)', () => {
            title = randomAlphaNumeric(256);
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleMax);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject empty title', () => {
            title = '';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject null title', () => {
            title = null;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject title as integer type', () => {
            title = 12345;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should create site with title as security payload - ${key} (input sanitized)`, () => {
                title = securityPayloads[key];
                cy.Post('/sites',
                    InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    const siteId = response.body.body.id;
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
                });
            });
        });
    });

    // ─── Domain Verifications ─────────────────────────────────────────────────

    describe('Domain Verifications', () => {
        it('should create site with valid unique domain', () => {
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with domain at max char limit (50)', () => {
            domain = randomAlphaNumeric(50).toLowerCase();
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with domain at min char limit (1)', () => {
            domain = randomAlphaNumeric(1).toLowerCase();
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with domain containing lowercase alphanumeric', () => {
            domain = 'valid' + randomAlphaNumeric(4).toLowerCase();
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with domain containing hyphens', () => {
            domain = `valid-domain-${randomAlphaNumeric(4).toLowerCase()}`;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should reject empty domain', () => {
            domain = '';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject null domain', () => {
            domain = null;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject domain as integer type', () => {
            domain = 123456;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject domain containing uppercase letters', () => {
            domain = 'Invalid' + randomAlphaNumeric(4);
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.domain[0]).to.eq(messages.domainCaseError);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject domain containing spaces', () => {
            domain = 'invalid ' + randomAlphaNumeric(4).toLowerCase();
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject domain starting with hyphen', () => {
            domain = '-' + randomAlphaNumeric(6).toLowerCase();
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject domain ending with hyphen', () => {
            domain = randomAlphaNumeric(6).toLowerCase() + '-';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject domain containing consecutive hyphens', () => {
            domain = `invalid--${randomAlphaNumeric(4).toLowerCase()}`;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject domain containing underscore', () => {
            domain = 'invalid_' + randomAlphaNumeric(4).toLowerCase();
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject domain containing special characters', () => {
            domain = 'invalid@' + randomAlphaNumeric(4) + '!';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject domain containing period/dot', () => {
            domain = 'invalid.' + randomAlphaNumeric(4).toLowerCase();
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject domain exceeding max char limit (51)', () => {
            domain = randomAlphaNumeric(51).toLowerCase();
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.domain[0]).to.eq(messages.domainLengthLimit);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject domain as security payload - ${key} (invalid domain format)`, () => {
                domain = securityPayloads[key];
                cy.Post('/sites',
                    InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Domain Uniqueness ────────────────────────────────────────────────────

    describe('Domain Uniqueness', () => {
        it('should reject domain that already exists', () => {
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((firstResponse) => {
                expect(firstResponse.status).to.eq(200);
                const siteId = firstResponse.body.body.id;
                cy.Post('/sites',
                    InputBody.sites(`Site ${randomAlphaNumeric(5)}`, domain, logoUrl, primaryColor, secondaryColor, layout),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    cy.expect(response.body.body.domain[0]).to.eq(messages.domainAlreadyTaken);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
                });
            });
        });

        it('should allow reusing domain of a deleted site', () => {
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((createResponse) => {
                expect(createResponse.status).to.eq(200);
                const siteId = createResponse.body.body.id;
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false }).then((deleteResponse) => {
                    expect(deleteResponse.status).to.eq(200);
                    cy.Post('/sites',
                        InputBody.sites(`Site ${randomAlphaNumeric(5)}`, domain, logoUrl, primaryColor, secondaryColor, layout),
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        const newSiteId = response.body.body.id;
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                        cy.Delete(`/sites/${newSiteId}`, { failOnStatusCode: false });
                    });
                });
            });
        });
    });

    // ─── Logo URL Verifications ───────────────────────────────────────────────

    describe('Logo URL Verifications', () => {
        it('should create site with valid logo_url as jpg', () => {
            logoUrl = fileUrls.jpg;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with valid logo_url as jpeg', () => {
            logoUrl = fileUrls.jpeg;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with valid logo_url as png', () => {
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with valid logo_url as svg', () => {
            logoUrl = fileUrls.svg;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should reject empty logo_url', () => {
            logoUrl = '';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject null logo_url', () => {
            logoUrl = null;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject logo_url as gif (invalid image format)', () => {
            logoUrl = fileUrls.gif;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.logo_url[0]).to.eq(messages.logoUrlTypeError);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject logo_url as document file (pdf)', () => {
            logoUrl = fileUrls.pdf;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.logo_url[0]).to.eq(messages.logoUrlTypeError);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject logo_url as video file (mp4)', () => {
            logoUrl = fileUrls.mp4;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.logo_url[0]).to.eq(messages.logoUrlTypeError);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject invalid logo_url format (no extension)', () => {
            logoUrl = 'not-a-valid-url';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject logo_url as integer type', () => {
            logoUrl = 12345;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject logo_url as security payload - ${key} (invalid URL)`, () => {
                logoUrl = securityPayloads[key];
                cy.Post('/sites',
                    InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Primary Color Verifications ──────────────────────────────────────────

    describe('Primary Color Verifications', () => {
        it('should create site with primary_color as valid 6-digit hash (#121212)', () => {
            primaryColor = '#121212';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with primary_color as 3-digit hash (#FFF)', () => {
            primaryColor = '#FFF';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with primary_color as lowercase hash (#abcdef)', () => {
            primaryColor = '#abcdef';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with primary_color as uppercase hash (#ABCDEF)', () => {
            primaryColor = '#ABCDEF';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should reject empty primary_color', () => {
            primaryColor = '';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.primaryColorRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject null primary_color', () => {
            primaryColor = null;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.primaryColorRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject primary_color without hash symbol', () => {
            primaryColor = 'ffffff';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject primary_color with invalid hex characters (#gggggg)', () => {
            primaryColor = '#gggggg';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject primary_color exceeding 7 chars (#fffffff)', () => {
            primaryColor = '#fffffff';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject primary_color as integer type', () => {
            primaryColor = 16777215;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject primary_color as RGB format', () => {
            primaryColor = 'rgb(255,255,255)';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject primary_color as security payload - ${key} (invalid color)`, () => {
                primaryColor = securityPayloads[key];
                cy.Post('/sites',
                    InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    cy.expect(response.body.body.primary_color[0]).to.eq(messages.instances.primaryColorInvalid);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Secondary Color Verifications ────────────────────────────────────────

    describe('Secondary Color Verifications', () => {
        it('should create site with secondary_color as valid 6-digit hash (#c8c6fd)', () => {
            secondaryColor = '#c8c6fd';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with secondary_color as 3-digit hash (#ABC)', () => {
            secondaryColor = '#ABC';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should reject empty secondary_color', () => {
            secondaryColor = '';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.secondaryColorRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject null secondary_color', () => {
            secondaryColor = null;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.secondaryColorRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject secondary_color without hash symbol', () => {
            secondaryColor = '654321';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject secondary_color with invalid hex characters (#zzzzzz)', () => {
            secondaryColor = '#zzzzzz';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject secondary_color as integer type', () => {
            secondaryColor = 654321;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject secondary_color as security payload - ${key} (invalid color)`, () => {
                secondaryColor = securityPayloads[key];
                cy.Post('/sites',
                    InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    cy.expect(response.body.body.secondary_color[0]).to.eq(messages.instances.secondaryColorInvalid);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Layout Verifications ─────────────────────────────────────────────────

    describe('Layout Verifications', () => {
        it('should create site with valid layout theme element name', () => {
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site without layout field (default layout applied)', () => {
            cy.Post('/sites',
                { title, domain, logo_url: logoUrl, primary_color: primaryColor, secondary_color: secondaryColor },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with layout as empty string (default layout applied)', () => {
            layout = '';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should create site with layout as null (default layout applied)', () => {
            layout = null;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should reject layout as non-existent theme element name', () => {
            layout = 'invalid-layout-xyz';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(422);
                cy.expect(response.body.status.message).to.eq(messages.instances.layoutInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject layout as integer type', () => {
            layout = 12345;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.layout[0]).to.eq(messages.instances.layoutType);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject layout as decimal type', () => {
            layout = 1.5;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.layout[0]).to.eq(messages.instances.layoutType);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject layout as boolean type', () => {
            layout = true;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.layout[0]).to.eq(messages.instances.layoutType);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject layout containing whitespace', () => {
            layout = 'invalid layout';
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(422);
                cy.expect(response.body.status.message).to.eq(messages.instances.layoutInvalid);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should reject layout as security payload - ${key} (invalid theme element)`, () => {
                layout = securityPayloads[key];
                cy.Post('/sites',
                    InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(422);
                    cy.expect(response.body.status.message).to.eq(messages.instances.layoutInvalid);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Missing Required Fields ──────────────────────────────────────────────

    describe('Missing Required Fields', () => {
        it('should reject payload without title field', () => {
            cy.Post('/sites',
                { domain, logo_url: logoUrl, primary_color: primaryColor, secondary_color: secondaryColor },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload without domain field', () => {
            cy.Post('/sites',
                { title, logo_url: logoUrl, primary_color: primaryColor, secondary_color: secondaryColor },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload without logo_url field', () => {
            cy.Post('/sites',
                { title, domain, primary_color: primaryColor, secondary_color: secondaryColor },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload without primary_color field', () => {
            cy.Post('/sites',
                { title, domain, logo_url: logoUrl, secondary_color: secondaryColor },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.primary_color[0]).to.eq(messages.primaryColorRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload without secondary_color field', () => {
            cy.Post('/sites',
                { title, domain, logo_url: logoUrl, primary_color: primaryColor },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.secondary_color[0]).to.eq(messages.secondaryColorRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload with only title field', () => {
            cy.Post('/sites', { title }, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });
    });

    // ─── Edge Cases ───────────────────────────────────────────────────────────

    describe('Edge Cases', () => {
        it('should reject empty JSON payload', () => {
            cy.Post('/sites', {}, { failOnStatusCode: false })
                .then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
        });

        it('should create site with extra/unexpected fields in payload (extra fields ignored)', () => {
            cy.Post('/sites',
                { ...InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout), extra_field: 'unexpected', another: 123 },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const siteId = response.body.body.id;
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${siteId}`, { failOnStatusCode: false });
            });
        });

        it('should return 405 for PUT request to POST /api/sites endpoint', () => {
            cy.request({
                method: 'PUT',
                url: '/sites',
                body: InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                headers: { Authorization: `Bearer ${Cypress.env('token')}` },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for DELETE request to POST /api/sites endpoint', () => {
            cy.request({
                method: 'DELETE',
                url: '/sites',
                headers: { Authorization: `Bearer ${Cypress.env('token')}` },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload with all fields as null', () => {
            title          = null;
            domain         = null;
            logoUrl        = null;
            primaryColor   = null;
            secondaryColor = null;
            layout         = null;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject payload with whitespace only in required string fields', () => {
            title          = '   ';
            domain         = '   ';
            logoUrl        = '   ';
            primaryColor   = '   ';
            secondaryColor = '   ';
            layout         = null;
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Response Validation ──────────────────────────────────────────────────

    describe('Response Validation', () => {
        it('should verify success response contains site id and all submitted fields', () => {
            cy.Post('/sites',
                InputBody.sites(title, domain, logoUrl, primaryColor, secondaryColor, layout),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                const body = response.body.body;
                expect(body).to.have.property('id');
                expect(body.title).to.eq(title);
                expect(body.domain).to.eq(domain);
                expect(body.primary_color).to.eq(primaryColor);
                expect(body.secondary_color).to.eq(secondaryColor);
                expect(body).to.have.property('logo_url');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${body.id}`, { failOnStatusCode: false });
            });
        });

        it('should verify error response contains validation error for missing title', () => {
            cy.Post('/sites',
                { domain, logo_url: logoUrl, primary_color: primaryColor, secondary_color: secondaryColor },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.title[0]).to.eq(messages.titleRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });
});
