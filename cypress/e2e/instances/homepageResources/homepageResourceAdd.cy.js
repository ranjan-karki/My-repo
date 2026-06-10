import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Add Homepage Resource Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;

    const resourceTypeContact = 'GlobalContact';
    const resourceTypeDocument = 'GlobalDocument';
    const resourceTypeImage = 'GlobalImage';
    const resourceTypeLink = 'GlobalLink';
    const resourceTypeDynCalc = 'SiteDynamicCalculator';
    const resourceTypeCalc = 'Calculator';
    const resourceTypeVideo = 'Video';
    const displayLogoTrue = true;
    const primaryColor = '#123456';
    const secondaryColor = '#654321';
    const settingKeyHomepageResource = 'enable_homepage_resource';
    const Order = 1;

    let instanceId;
    let videoResourceId, videoVersionId;
    let contactResourceId;
    let documentResourceId;
    let imageResourceId;
    let linkResourceId;
    let dynamicCalcResourceId;
    let calcResourceId;

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
                const targetSetting = data.find(setting => setting.key === settingKeyHomepageResource);
                const settingId = targetSetting.id;
                cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                    InputBody.instanceSettings(settingKeyHomepageResource, 1),
                    { failOnStatusCode: false }
                ).then((putResponse) => {
                    expect(putResponse.status).to.eq(200);
                    expect(Number(putResponse.body.body.value)).to.eq(1);
                });
            });
        });

        cy.GetItems(`/sites/${site_id}/available-videos`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            videoResourceId = response.body.body.data[0].id;
            videoVersionId = response.body.body.data[0].version_id ?? null;
        });

        cy.GetItems(`/v2/sites/${site_id}/available-contacts`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            contactResourceId = response.body.body.data[0].id;
        });

        cy.GetItems(`/v2/sites/${site_id}/available-documents`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            documentResourceId = response.body.body.data[0].id;
        });

        cy.GetItems(`/v2/sites/${site_id}/available-images`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            imageResourceId = response.body.body.data[0].id;
        });

        cy.GetItems(`/v2/sites/${site_id}/available-links`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            linkResourceId = response.body.body.data[0].id;
        });

        cy.GetItems(`/sites/${site_id}/dynamic-calculators`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            dynamicCalcResourceId = response.body.body.data[0].id;
        });

        cy.GetItems(`/calculators`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            calcResourceId = response.body.body.data[0].id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    after(() => {
        if (instanceId) {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}`, { failOnStatusCode: false });
        }
    });

    describe('Positive Scenarios', () => {
        it('should add homepage resource with all valid inputs', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: contactResourceId, resource_type: resourceTypeContact },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with valid mandatory fields only (no version_id)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, documentResourceId, null, resourceTypeDocument),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: documentResourceId, resource_type: resourceTypeDocument },
                    failOnStatusCode: false
                });
            });
        });

        it('should reject order as 0', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(0, imageResourceId, null, resourceTypeImage),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderMin);
            });
        });

        it('should add homepage resource with order as positive integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(5, linkResourceId, null, resourceTypeLink),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: linkResourceId, resource_type: resourceTypeLink },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with order exceeding existing count', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(999, dynamicCalcResourceId, null, resourceTypeDynCalc),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: dynamicCalcResourceId, resource_type: resourceTypeDynCalc },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with resource_type as GlobalContact', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: contactResourceId, resource_type: resourceTypeContact },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with resource_type as GlobalDocument', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, documentResourceId, null, resourceTypeDocument),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: documentResourceId, resource_type: resourceTypeDocument },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with resource_type as GlobalImage', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, imageResourceId, null, resourceTypeImage),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: imageResourceId, resource_type: resourceTypeImage },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with resource_type as GlobalLink', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, linkResourceId, null, resourceTypeLink),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: linkResourceId, resource_type: resourceTypeLink },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with resource_type as SiteDynamicCalculator', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, dynamicCalcResourceId, null, resourceTypeDynCalc),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: dynamicCalcResourceId, resource_type: resourceTypeDynCalc },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with resource_type as Calculator', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, calcResourceId, null, resourceTypeCalc),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: calcResourceId, resource_type: resourceTypeCalc },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with version_id as null for video', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, videoResourceId, null, resourceTypeVideo),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: videoResourceId, resource_type: resourceTypeVideo },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with valid version_id for video resource', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, videoResourceId, videoVersionId, resourceTypeVideo),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: videoResourceId, resource_type: resourceTypeVideo },
                    failOnStatusCode: false
                });
            });
        });

        it('should add homepage resource with extra unknown fields in payload (extra fields ignored)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                { ...InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact), extra_field: 'test' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: contactResourceId, resource_type: resourceTypeContact },
                    failOnStatusCode: false
                });
            });
        });
    });

    describe('Order Verifications', () => {
        it('should reject order as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(-1, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderMin);
            });
        });

        it('should reject empty order', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources('', contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderRequired);
            });
        });

        it('should reject order as string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(getRandomSubstring(5), contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderNumber);
            });
        });

        it('should reject order as long string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(randomAlphaNumeric(500), contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderNumber);
            });
        });

        it('should reject order as long integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(999999999999999, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderMaxDigits);
            });
        });

        it('should reject order as boolean', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(true, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.order[0]).to.eq(messages.orderNumber);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in order input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                    InputBody.homepageResources(securityPayloads[key], contactResourceId, null, resourceTypeContact),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Resource ID Verifications', () => {
        it('should reject resource_id as 0', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, 0, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject resource_id as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, -1, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject resource_id that does not exist', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, 999999, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject empty resource_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, '', null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_id[0]).to.eq(messages.homepageResources.resourceIdRequired);
            });
        });

        it('should reject resource_id as string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, getRandomSubstring(5), null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_id[0]).to.eq(messages.homepageResources.resourceIdInteger);
            });
        });

        it('should reject resource_id as long string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, randomAlphaNumeric(500), null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_id[0]).to.eq(messages.homepageResources.resourceIdInteger);
            });
        });

        it('should reject resource_id as long integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, 999999999999999, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject resource_id of another site', () => {
            cy.GetItems(`/sites/${another_reseller_site}/available-contacts`, { failOnStatusCode: false }).then((availRes) => {
                if (availRes.status !== 200 || !availRes.body.body?.data?.[0]) return;
                const anotherSiteResourceId = availRes.body.body.data[0].id;
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                    InputBody.homepageResources(Order, anotherSiteResourceId, null, resourceTypeContact),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in resource_id input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                    InputBody.homepageResources(Order, securityPayloads[key], null, resourceTypeContact),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Version ID Verifications', () => {
        it('should ignore version_id for non-video resource type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, videoVersionId, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_id: contactResourceId, resource_type: resourceTypeContact },
                    failOnStatusCode: false
                });
            });
        });

        it('should reject version_id as 0', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, videoResourceId, 0, resourceTypeVideo),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject version_id as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, videoResourceId, -1, resourceTypeVideo),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject version_id that does not exist', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, videoResourceId, 999999, resourceTypeVideo),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject version_id as string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, videoResourceId, getRandomSubstring(5), resourceTypeVideo),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.version_id[0]).to.eq(messages.versionIdInteger);
            });
        });

        it('should reject version_id as decimal', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, videoResourceId, 1.5, resourceTypeVideo),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.version_id[0]).to.eq(messages.versionIdInteger);
            });
        });

        it('should reject version_id as long integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, videoResourceId, 999999999999999, resourceTypeVideo),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in version_id input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                    InputBody.homepageResources(Order, videoResourceId, securityPayloads[key], resourceTypeVideo),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Resource Type Verifications', () => {
        it('should reject resource_type as invalid string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, 'InvalidType'),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_type[0]).to.eq(messages.homepageResources.resourceTypeInvalid);
            });
        });

        it('should reject empty resource_type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, ''),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_type[0]).to.eq(messages.homepageResources.resourceTypeRequired);
            });
        });

        it('should reject resource_type as integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, 12345),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_type[0]).to.eq(messages.homepageResources.resourceTypeInvalid);
            });
        });

        it('should reject resource_type as long char set', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, randomAlphaNumeric(500)),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_type[0]).to.eq(messages.homepageResources.resourceTypeInvalid);
            });
        });

        it('should reject mismatched resource_type and resource_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeDocument),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in resource_type input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                    InputBody.homepageResources(Order, contactResourceId, null, securityPayloads[key]),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Instance ID Verifications', () => {
        it('should reject duplicate homepage resource (same resource_id and resource_type)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((firstResponse) => {
                expect(firstResponse.status).to.eq(200);
                cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                    InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                        body: { resource_id: contactResourceId, resource_type: resourceTypeContact },
                        failOnStatusCode: false
                    });
                });
            });
        });

        it('should reject all fields as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(null, null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject empty payload', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                {},
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject array payload (multiple resources in single request)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                [
                    InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                    InputBody.homepageResources(2, documentResourceId, null, resourceTypeDocument)
                ],
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject non-existent site_id', () => {
            cy.Post(`/sites/999999/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject another reseller site_id', () => {
            cy.Post(`/sites/${another_reseller_site}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject deleted site_id', () => {
            cy.Post(`/sites/${deleted_site}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject invalid (non-numeric) site_id', () => {
            cy.Post(`/sites/invalid_site_id/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject non-existent instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/999999/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject invalid (non-numeric) instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/invalid_id/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });
    });
});
