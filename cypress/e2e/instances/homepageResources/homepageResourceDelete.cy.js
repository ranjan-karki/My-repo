import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Delete Homepage Resource Tests', () => {
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
    let anotherSiteInstanceId;
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

        cy.GetItems(`/sites/${another_reseller_site}/instances`, { failOnStatusCode: false }).then((response) => {
            if (response.status === 200 && response.body.body.length > 0) {
                anotherSiteInstanceId = response.body.body[0].id;
            }
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
        it('should delete homepage resource with all valid inputs', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should delete homepage resource with valid resource_type and resource_id only (version_id null)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, documentResourceId, null, resourceTypeDocument),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeDocument, resource_id: documentResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should delete homepage resource with resource_type as GlobalContact', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should delete homepage resource with resource_type as GlobalDocument', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, documentResourceId, null, resourceTypeDocument),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeDocument, resource_id: documentResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should delete homepage resource with resource_type as GlobalImage', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, imageResourceId, null, resourceTypeImage),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeImage, resource_id: imageResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should delete homepage resource with resource_type as GlobalLink', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, linkResourceId, null, resourceTypeLink),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeLink, resource_id: linkResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should delete homepage resource with resource_type as SiteDynamicCalculator', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, dynamicCalcResourceId, null, resourceTypeDynCalc),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeDynCalc, resource_id: dynamicCalcResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should delete homepage resource with resource_type as Calculator', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, calcResourceId, null, resourceTypeCalc),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeCalc, resource_id: calcResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should delete homepage resource with version_id as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should delete homepage resource with valid version_id for video resource', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, videoResourceId, videoVersionId, resourceTypeVideo),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeVideo, resource_id: videoResourceId, version_id: videoVersionId },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should delete homepage resource with extra unknown fields in payload (extra fields ignored)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null, extra_field: 'test' },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Resource Type Verifications', () => {
        it('should reject delete with resource_type as invalid string', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: 'InvalidType', resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_type[0]).to.eq(messages.homepageResources.resourceTypeInvalid);
            });
        });

        it('should reject delete with empty resource_type', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: '', resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_type[0]).to.eq(messages.homepageResources.resourceTypeRequired);
            });
        });

        it('should reject delete with resource_type as integer', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: 12345, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_type[0]).to.eq(messages.homepageResources.resourceTypeInvalid);
            });
        });

        it('should reject delete with resource_type in lowercase', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: 'globalcontact', resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_type[0]).to.eq(messages.homepageResources.resourceTypeInvalid);
            });
        });

        it('should reject delete with resource_type in mixed case', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: 'globalContact', resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_type[0]).to.eq(messages.homepageResources.resourceTypeInvalid);
            });
        });

        it('should reject delete with resource_type as long char set', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: randomAlphaNumeric(500), resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_type[0]).to.eq(messages.homepageResources.resourceTypeInvalid);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in resource_type input: ${key}`, () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: securityPayloads[key], resource_id: contactResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Resource ID Verifications', () => {
        it('should reject delete with resource_id as 0', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: 0, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with resource_id as negative integer', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: -1, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with resource_id that does not exist', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: 999999, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with resource_id that is not attached to instance', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with empty resource_id', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: '', version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_id[0]).to.eq(messages.homepageResources.resourceIdRequired);
            });
        });

        it('should reject delete with resource_id input as string', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: getRandomSubstring(5), version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_id[0]).to.eq(messages.homepageResources.resourceIdInteger);
            });
        });

        it('should reject delete with resource_id input as decimal', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: 1.5, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.resource_id[0]).to.eq(messages.homepageResources.resourceIdInteger);
            });
        });

        it('should reject delete with resource_id input as long integer', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: 999999999999999, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with resource_id of another site', () => {
            cy.GetItems(`/v2/sites/${another_reseller_site}/available-contacts`, { failOnStatusCode: false }).then((availRes) => {
                if (availRes.status !== 200 || !availRes.body.body?.data?.[0]) return;
                const anotherSiteResourceId = availRes.body.body.data[0].id;
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeContact, resource_id: anotherSiteResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should reject delete with already deleted resource_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((firstDeleteResponse) => {
                    expect(firstDeleteResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                        body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                        failOnStatusCode: false
                    }).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in resource_id input: ${key}`, () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeContact, resource_id: securityPayloads[key], version_id: null },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Version ID Verifications', () => {
        it('should reject delete with version_id for non-video resource type', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: videoVersionId },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with version_id as 0', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeVideo, resource_id: videoResourceId, version_id: 0 },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with version_id as negative integer', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeVideo, resource_id: videoResourceId, version_id: -1 },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with version_id that does not exist', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeVideo, resource_id: videoResourceId, version_id: 999999 },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with version_id input as string', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeVideo, resource_id: videoResourceId, version_id: getRandomSubstring(5) },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.version_id[0]).to.eq(messages.versionIdInteger);
            });
        });

        it('should reject delete with version_id input as decimal', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeVideo, resource_id: videoResourceId, version_id: 1.5 },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.body.version_id[0]).to.eq(messages.versionIdInteger);
            });
        });

        it('should reject delete with version_id input as long integer', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeVideo, resource_id: videoResourceId, version_id: 999999999999999 },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in version_id input: ${key}`, () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeVideo, resource_id: videoResourceId, version_id: securityPayloads[key] },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Site & Instance ID Verifications', () => {
        it('should reject delete with site id that does not exist', () => {
            cy.Delete(`/sites/999999/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject delete with site id of another reseller', () => {
            cy.Delete(`/sites/${another_reseller_site}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject delete with deleted site id', () => {
            cy.Delete(`/sites/${deleted_site}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject delete with empty site id', () => {
            cy.Delete(`/sites//instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with instance id that does not exist', () => {
            cy.Delete(`/sites/${site_id}/instances/999999/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject delete with instance id of another site', () => {
            cy.Delete(`/sites/${site_id}/instances/${anotherSiteInstanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject delete with deleted instance id', () => {
            cy.Delete(`/sites/${site_id}/instances/999998/homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should reject delete with empty instance id', () => {
            cy.Delete(`/sites/${site_id}/instances//homepage-resources`, {
                body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Payload Verifications', () => {
        it('should reject delete with mismatched resource_type and resource_id', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeDocument, resource_id: contactResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with resource_id belonging to different resource_type', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: resourceTypeImage, resource_id: linkResourceId, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with all fields as null', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: { resource_type: null, resource_id: null, version_id: null },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete with empty payload', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                body: {},
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject delete homepage resource that was already deleted/detached', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                    failOnStatusCode: false
                }).then((firstDeleteResponse) => {
                    expect(firstDeleteResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                        body: { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                        failOnStatusCode: false
                    }).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

        it('should handle delete multiple homepage resources in single request', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                InputBody.homepageResources(Order, contactResourceId, null, resourceTypeContact),
                { failOnStatusCode: false }
            ).then((addResponse) => {
                expect(addResponse.status).to.eq(200);
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-resources`, {
                    body: [
                        { resource_type: resourceTypeContact, resource_id: contactResourceId, version_id: null },
                        { resource_type: resourceTypeDocument, resource_id: documentResourceId, version_id: null }
                    ],
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.be.oneOf([200, 417]);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should reject delete with valid inputs but malformed JSON', () => {
            cy.request({
                method: 'DELETE',
                url: `/sites/${site_id}/instances/${instanceId}/homepage-resources`,
                headers: {
                    Authorization: `Bearer ${Cypress.env('token')}`,
                    'Content-Type': 'application/json'
                },
                body: '{ resource_type: GlobalContact, resource_id: }',
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });
});
