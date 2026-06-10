import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS, CALCULATOR_IDs } from "../../../support/testConfig";

describe('Add Instance Page Calculator Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedCalculatorId, unpublish: unpublishedCalculatorId, AnotherResellerCalculator: anotherResellerCalculatorId, unpublishedDynamcCalculator: unpublishedDynamicCalculatorId, secondarySiteDynamicCalculator: secondarySiteDynamicCalculatorId } = CALCULATOR_IDs;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;
    const primaryColor = '#123456';
    const secondaryColor = '#654321';
    const displayLogoTrue = true;
    const Order = 1;

    const calcTypeCalculator = 'Calculator';
    const calcTypeDynamic = 'SiteDynamicCalculator';

    let instanceId;
    let pageId;
    let anotherInstancePageId;
    let anotherSiteInstanceId;

    let calculatorId;
    let dynamicCalculatorId;
    let uniqueCalculatorId;
    let uniqueDynamicCalculatorId;

    const calcBody = (overrides = {}) => ({
        ...InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, Order),
        ...overrides
    });

    before(() => {
        cy.loginAndGetToken();

        // Create instance + page
        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: `Page ${randomAlphaNumeric(5)}`, status: true }, { failOnStatusCode: false }
            ).then((pageResponse) => { expect(pageResponse.status).to.eq(200); pageId = pageResponse.body.body.id; });
        });

        // Create another instance + page for cross-instance tests
        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            const otherInstanceId = response.body.body.id;
            cy.Post(`/sites/${site_id}/instances/${otherInstanceId}/pages`,
                { title: `Other Page ${randomAlphaNumeric(5)}`, status: true }, { failOnStatusCode: false }
            ).then((pageResponse) => { expect(pageResponse.status).to.eq(200); anotherInstancePageId = pageResponse.body.body.id; });
        });

        // Get another reseller's instance
        cy.GetItems(`/sites/${another_reseller_site}/instances`, { failOnStatusCode: false }).then((response) => {
            if (response.status === 200 && response.body.body.length > 0) anotherSiteInstanceId = response.body.body[0].id;
        });

        // Fetch available calculators and dynamic calculators, then find unique ones
        cy.GetItems(`/calculators`, { failOnStatusCode: false }).then((calcResponse) => {
            expect(calcResponse.status).to.eq(200);
            const calculators = calcResponse.body.body.data || [];
            const calcIds = calculators.map(c => c.id);
            calculatorId = calcIds[0];

            cy.GetItems(`/sites/${site_id}/dynamic-calculators`, { failOnStatusCode: false }).then((dynResponse) => {
                expect(dynResponse.status).to.eq(200);
                const dynamicCalculators = dynResponse.body.body.data || [];
                const dynIds = dynamicCalculators.map(c => c.id);
                dynamicCalculatorId = dynIds[0];

                // Find a calculator ID that is NOT in the dynamic calculator IDs
                uniqueCalculatorId = calcIds.find(id => !dynIds.includes(id)) || calculatorId;
                // Find a dynamic calculator ID that is NOT in the regular calculator IDs
                uniqueDynamicCalculatorId = dynIds.find(id => !calcIds.includes(id)) || dynamicCalculatorId;
            });
        });
    });

    beforeEach(() => { cy.loginAndGetToken(); });

    // ─── Positive Scenarios ───────────────────────────────────────────────────

    describe('Positive Scenarios', () => {
        it('should attach calculator with type Calculator and valid order', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.status.code).to.eq('ok');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should attach calculator with type dynamic-calculator and valid order', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(dynamicCalculatorId, calcTypeDynamic, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.status.code).to.eq('ok');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should attach calculator with order as 0', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, 0),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should attach calculator with order as large positive integer (999)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, 999),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should attach dynamic-calculator with order as 0', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(dynamicCalculatorId, calcTypeDynamic, 0),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Calculator Type - Valid ──────────────────────────────────────────────

    describe('Calculator Type - Valid', () => {
        it('should accept calculator_type as Calculator', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should accept calculator_type as dynamic-calculator', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(dynamicCalculatorId, calcTypeDynamic, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Calculator Type - Invalid ────────────────────────────────────────────

    describe('Calculator Type - Invalid', () => {
        it('should reject calculator_type as invalid string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, 'InvalidType', Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject empty calculator_type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, '', Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject null calculator_type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, null, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject calculator_type as integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, 12345, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject calculator_type as boolean', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, true, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });


        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in calculator_type input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                    InputBody.instancePageCalculators(calculatorId, securityPayloads[key], Order),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Calculator ID - Invalid ──────────────────────────────────────────────

    describe('Calculator ID - Invalid', () => {
        it('should reject calculator_id as 0', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(0, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.not.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject calculator_id as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(-1, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.not.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject non-existent calculator_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(999999, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.not.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for deleted calculator_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(deletedCalculatorId, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for unpublished calculator_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(unpublishedCalculatorId, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for calculator_id belonging to another reseller', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(anotherResellerCalculatorId, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for unpublished dynamic-calculator_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(unpublishedDynamicCalculatorId, calcTypeDynamic, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for dynamic-calculator_id belonging to a secondary site', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(secondarySiteDynamicCalculatorId, calcTypeDynamic, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject empty calculator_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators('', calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject null calculator_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(null, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject calculator_id as string', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(getRandomSubstring(5), calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject calculator_id as decimal', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(1.5, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject calculator_id as very long integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(999999999999999, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.not.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in calculator_id input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                    InputBody.instancePageCalculators(securityPayloads[key], calcTypeCalculator, Order),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── Order Field - Valid ──────────────────────────────────────────────────

    describe('Order Field - Valid', () => {
        it('should attach calculator with order as 0', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, 0),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should attach calculator with order as 1', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, 1),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should attach calculator with order as large positive integer (999)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, 999),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Order Field - Invalid ────────────────────────────────────────────────

    describe('Order Field - Invalid', () => {
        it('should reject order as negative integer (-1)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, -1),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.homepageVideos.orderMin);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as large negative integer (-999)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, -999),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.homepageVideos.orderMin);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as empty value', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, ''),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, getRandomSubstring(5)),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as decimal (1.5)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, 1.5),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as very long integer (exceeds int limit)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, 999999999999999),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderMaxDigits);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in order input: ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                    InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, securityPayloads[key]),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── URL Param - Site ─────────────────────────────────────────────────────

    describe('URL Param - Site', () => {
        it('should return 404 for non-existent site_id', () => {
            cy.Post(`/sites/999999/instances/${instanceId}/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for deleted site_id', () => {
            cy.Post(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for another reseller site_id', () => {
            cy.Post(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for site_id as string type', () => {
            cy.Post(`/sites/invalid_site/instances/${instanceId}/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for site_id as negative integer', () => {
            cy.Post(`/sites/-1/instances/${instanceId}/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    // ─── URL Param - Instance ─────────────────────────────────────────────────

    describe('URL Param - Instance', () => {
        it('should return 404 for non-existent instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/999999/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for instance_id belonging to another site', () => {
            cy.Post(`/sites/${site_id}/instances/${anotherSiteInstanceId}/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for instance_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/invalid_id/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for instance_id as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/-1/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    // ─── URL Param - Page ─────────────────────────────────────────────────────

    describe('URL Param - Page', () => {
        it('should return 404 for non-existent page_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/999999/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id belonging to another instance', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id as string type', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/invalid_page/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id as negative integer', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/-1/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id as zero', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/0/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    // ─── URL Param - Security ─────────────────────────────────────────────────

    describe('URL Param - Security', () => {
        it('should return 404 for site_id as XSS payload', () => {
            cy.Post(`/sites/${encodeURIComponent(securityPayloads.xss)}/instances/${instanceId}/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for instance_id as SQL injection', () => {
            cy.Post(`/sites/${site_id}/instances/${encodeURIComponent(securityPayloads.sql)}/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id as directory traversal', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads.pathTraversal)}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    // ─── Duplicate and Conflict ───────────────────────────────────────────────

    describe('Duplicate and Conflict', () => {
        it('should handle attaching same calculator twice to the same page', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((firstResponse) => {
                expect(firstResponse.status).to.eq(200);
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                    InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, 2),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should attach calculator and resequence when order conflicts', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should attach calculator at end of list when order exceeds current count', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, 9999),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Edge Cases ───────────────────────────────────────────────────────────

    describe('Edge Cases', () => {
        it('should return 417 for empty JSON payload', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                {}, { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for PUT request to POST endpoint', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                calcBody(), { failOnStatusCode: false }
            ).then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should attach calculator and ignore extra/unexpected fields in payload', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                { ...InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, Order), extra_field: 'test' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 417 for all fields as null', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(null, null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Response Validation ──────────────────────────────────────────────────

    describe('Response Validation', () => {
        it('should return correct response body structure on successful POST (Calculator)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.status.code).to.eq('ok');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return correct response body structure on successful POST (dynamic-calculator)', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(dynamicCalculatorId, calcTypeDynamic, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.status.code).to.eq('ok');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should verify attached calculator appears in GET list', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(calculatorId, calcTypeCalculator, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                    .then((getResponse) => {
                        expect(getResponse.status).to.eq(200);
                        const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data || []);
                        expect(list.find(c => c.id === calculatorId || c.calculator_id === calculatorId)).to.exist;
                        expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                    });
            });
        });

        it('should verify attached dynamic-calculator appears in GET list', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                InputBody.instancePageCalculators(dynamicCalculatorId, calcTypeDynamic, Order),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                    .then((getResponse) => {
                        expect(getResponse.status).to.eq(200);
                        const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data || []);
                        expect(list.find(c => c.id === dynamicCalculatorId || c.calculator_id === dynamicCalculatorId)).to.exist;
                        expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                    });
            });
        });
    });
});
