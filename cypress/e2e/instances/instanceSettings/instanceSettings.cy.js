import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Instance Settings Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;

    const displayLogoTrue = true;
    const primaryColor = '#123456';
    const secondaryColor = '#654321';
    const settingKeyHomepageResource = settingKeyHomepageResource;

    let instanceId;
    let settingId;

    before(() => {
        cy.loginAndGetToken();

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;

            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/settings`, { failOnStatusCode: false }).then((settingsResponse) => {
                expect(settingsResponse.status).to.eq(200);
                const body = settingsResponse.body.body;
                const data = Array.isArray(body) ? body : (body.data ?? [body]);
                settingId = data[0].id;
            });
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    describe('Positive Scenarios - GET', () => {
        it('should retrieve instance settings with valid site and instance id', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/settings`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Positive Scenarios - PUT', () => {
        it('should update setting to true', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should update setting to false', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, false),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                    InputBody.instanceSettings(settingKeyHomepageResource, true), { failOnStatusCode: false });
            });
        });

        it('should accept value as integer 1', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, 1),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept value as integer 0', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, 0),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                    InputBody.instanceSettings(settingKeyHomepageResource, 1), { failOnStatusCode: false });
            });
        });

        it('should accept value as boolean true', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept value as boolean false', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, false),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                    InputBody.instanceSettings(settingKeyHomepageResource, true), { failOnStatusCode: false });
            });
        });
    });

    describe('Value Verifications', () => {
        it('should reject update with value as negative integer', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, -1),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.value[0]).to.eq(messages.instanceSettings.valueInvalid);
            });
        });

        it('should reject update with value as integer greater than 1', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, 2),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.value[0]).to.eq(messages.instanceSettings.valueInvalid);
            });
        });

        it('should reject update with value as string', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, 'yes'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.value[0]).to.eq(messages.instanceSettings.valueInvalid);
            });
        });

        it('should reject update with empty value', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, ''),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.value[0]).to.eq(messages.instanceSettings.valueRequired);
            });
        });

        it('should reject update with value as null', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with value as decimal', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, 0.5),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.value[0]).to.eq(messages.instanceSettings.valueInvalid);
            });
        });

        Object.keys(securityPayloads).forEach((payloadKey) => {
            it(`should handle security verification in value input: ${payloadKey}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                    InputBody.instanceSettings(settingKeyHomepageResource, securityPayloads[payloadKey]),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Setting ID Verifications', () => {
        it('should reject update with non-existent setting_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/999999`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject update with setting_id as 0', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/0`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with setting_id as negative', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/-1`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject update with setting_id as string', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/invalid`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Instance ID Verifications', () => {
        it('should reject GET with non-existent site id', () => {
            cy.GetItems(`/sites/999999/instances/${instanceId}/settings`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject GET with non-existent instance id', () => {
            cy.GetItems(`/sites/${site_id}/instances/999999/settings`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject GET with deleted site id', () => {
            cy.GetItems(`/sites/${deleted_site}/instances/${instanceId}/settings`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject GET with another reseller site id', () => {
            cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/settings`, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject PUT with non-existent site id', () => {
            cy.Put(`/sites/999999/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject PUT with non-existent instance id', () => {
            cy.Put(`/sites/${site_id}/instances/999999/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject PUT with deleted site id', () => {
            cy.Put(`/sites/${deleted_site}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject PUT with another reseller site id', () => {
            cy.Put(`/sites/${another_reseller_site}/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject PUT with invalid (non-numeric) site id', () => {
            cy.Put(`/sites/invalid_site_id/instances/${instanceId}/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject PUT with invalid (non-numeric) instance id', () => {
            cy.Put(`/sites/${site_id}/instances/invalid_id/settings/${settingId}`,
                InputBody.instanceSettings(settingKeyHomepageResource, true),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });
    });
});
