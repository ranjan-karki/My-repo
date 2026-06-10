import { InputBody } from "../../../support/inputBody";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { messages } from "../../../support/messages";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Delete and Get Instance Button Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;

    const placementNavbar   = 'navbar';
    const typeLink          = 'link';
    const statusUnpublish   = 1;
    const stylePrimary      = 1;
    const contentUrl        = 'https://example.com';
    const Order             = 1;

    let instanceId;
    let buttonSettingId;
    let buttonId;
    let buttonTitle;

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

                    buttonTitle = `DeleteTest_${randomAlphaNumeric(5)}`;
                    cy.Post(`/sites/${site_id}/button-resources`,
                        InputBody.instanceButtons(buttonTitle, placementNavbar, null, stylePrimary, null, '#ffffff', '#000000', Order, statusUnpublish, typeLink, contentUrl, null),
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

    // ─── GET List ─────────────────────────────────────────────────────────────

    it('should validate created button is in the list', () => {
        cy.GetItems(`/sites/${site_id}/button-resources`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            const buttons = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
            const foundButton = buttons.find(btn => btn.id === buttonId);
            expect(foundButton).to.exist;
            expect(foundButton.title).to.eq(buttonTitle);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    // ─── GET Single ───────────────────────────────────────────────────────────

    it('should get button details with id attached in the url', () => {
        cy.GetItems(`/sites/${site_id}/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.body.id).to.eq(buttonId);
            expect(response.body.body.title).to.eq(buttonTitle);
            expect(response.body.body.placement).to.eq('navbar');
            expect(response.body.body.type).to.eq('link');
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get button using another reseller site', () => {
        cy.GetItems(`/sites/${another_reseller_site}/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get button using deleted site', () => {
        cy.GetItems(`/sites/${deleted_site}/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get button using non-existent site id', () => {
        cy.GetItems(`/sites/999999/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get button using invalid (non-numeric) site id', () => {
        cy.GetItems(`/sites/invalid_site_id/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get button using non-existent button id', () => {
        cy.GetItems(`/sites/${site_id}/button-resources/999999`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get button using invalid (non-numeric) button id', () => {
        cy.GetItems(`/sites/${site_id}/button-resources/invalid_id`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get button using negative button id', () => {
        cy.GetItems(`/sites/${site_id}/button-resources/-1`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    // ─── DELETE Validation ────────────────────────────────────────────────────

    it('should return 404 when trying to delete button using another reseller site', () => {
        cy.Delete(`/sites/${another_reseller_site}/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to delete button using deleted site', () => {
        cy.Delete(`/sites/${deleted_site}/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to delete button using non-existent site id', () => {
        cy.Delete(`/sites/999999/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to delete button using invalid (non-numeric) site id', () => {
        cy.Delete(`/sites/invalid_site_id/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to delete button using non-existent button id', () => {
        cy.Delete(`/sites/${site_id}/button-resources/999999`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to delete button using invalid (non-numeric) button id', () => {
        cy.Delete(`/sites/${site_id}/button-resources/invalid_id`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    // ─── DELETE & Verify ──────────────────────────────────────────────────────

    it('should delete the button successfully', () => {
        cy.Delete(`/sites/${site_id}/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            if (typeof response.body.body === 'boolean') {
                expect(response.body.body).to.be.true;
            } else if (response.body.body && response.body.body.success !== undefined) {
                expect(response.body.body.success).to.be.true;
            }
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to get the deleted button', () => {
        cy.GetItems(`/sites/${site_id}/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should return 404 when trying to delete an already deleted button', () => {
        cy.Delete(`/sites/${site_id}/button-resources/${buttonId}`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(404);
            cy.expect(response.body.status.message).to.eq(messages.notFound);
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });

    it('should confirm deleted button is no longer in the list', () => {
        cy.GetItems(`/sites/${site_id}/button-resources`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            const buttons = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
            const foundButton = buttons.find(btn => btn.id === buttonId);
            expect(foundButton).to.not.exist;
            expect(response.duration).to.be.lessThan(responseTimeLimit);
        });
    });
});
