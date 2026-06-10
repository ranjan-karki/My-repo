import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { InputBody } from "../../../support/inputBody";
import { SITES, THEMES, TIMEOUTS, CALCULATOR_IDs } from "../../../support/testConfig";

describe('Delete and Get Instance Page Calculator Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedCalculatorId, unpublish: unpublishedCalculatorId, AnotherResellerCalculator: anotherResellerCalculatorId, unpublishedDynamcCalculator: unpublishedDynamicCalculatorId, secondarySiteDynamicCalculator: secondarySiteDynamicCalculatorId } = CALCULATOR_IDs;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout       = THEMES.theme1;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    const displayLogoTrue   = true;
    const Order             = 1;

    const calcTypeCalculator = 'Calculator';
    const calcTypeDynamic    = 'SiteDynamicCalculator';

    let instanceId;
    let pageId;
    let anotherInstancePageId;

    let calculatorId;
    let dynamicCalculatorId;


    const attachCalculator = (calcId, calcType, then) => {
        cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
            InputBody.instancePageCalculators(calcId, calcType, Order), { failOnStatusCode: false })
            .then((response) => {
                expect(response.status).to.eq(200);
                then(calcId); 
            });
    };

    const detachCalculator = (calcId, calcType, url = `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`) =>
        cy.Delete(url, { body: { calculator_id: calcId, calculator_type: calcType }, failOnStatusCode: false });

    before(() => {
        cy.loginAndGetToken();

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: `Page ${randomAlphaNumeric(5)}`, status: true }, { failOnStatusCode: false }
            ).then((pageResponse) => { expect(pageResponse.status).to.eq(200); pageId = pageResponse.body.body.id; });
        });

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            const otherInstanceId = response.body.body.id;
            cy.Post(`/sites/${site_id}/instances/${otherInstanceId}/pages`,
                { title: `Other Page ${randomAlphaNumeric(5)}`, status: true }, { failOnStatusCode: false }
            ).then((pageResponse) => { expect(pageResponse.status).to.eq(200); anotherInstancePageId = pageResponse.body.body.id; });
        });

        // Fetch a real calculator and a real dynamic calculator to attach.
        cy.GetItems(`/calculators`, { failOnStatusCode: false }).then((calcResponse) => {
            expect(calcResponse.status).to.eq(200);
            calculatorId = (calcResponse.body.body.data || [])[0]?.id;
        });

        cy.GetItems(`/sites/${site_id}/dynamic-calculators`, { failOnStatusCode: false }).then((dynResponse) => {
            expect(dynResponse.status).to.eq(200);
            dynamicCalculatorId = (dynResponse.body.body.data || [])[0]?.id;
        });
    });

    beforeEach(() => { cy.loginAndGetToken(); });

    // ─── DELETE ───────────────────────────────────────────────────────────────

    describe('DELETE - Remove Calculator from Page', () => {
        describe('Positive Scenarios', () => {
            it('should delete attached Calculator successfully and confirm it is no longer in list', () => {
                attachCalculator(calculatorId, calcTypeCalculator, (calcId) => {
                    detachCalculator(calcId, calcTypeCalculator)
                        .then((deleteResponse) => {
                            expect(deleteResponse.status).to.eq(200);
                            expect(deleteResponse.duration).to.be.lessThan(responseTimeLimit);
                            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                                .then((listResponse) => {
                                    expect(listResponse.status).to.eq(200);
                                    const list = Array.isArray(listResponse.body.body) ? listResponse.body.body : (listResponse.body.body.data || []);
                                    expect(list.find(c => c.id === calcId || c.calculator_id === calcId)).to.not.exist;
                                    expect(listResponse.duration).to.be.lessThan(responseTimeLimit);
                                });
                        });
                });
            });

            it('should delete attached dynamic-calculator successfully and confirm it is no longer in list', () => {
                attachCalculator(dynamicCalculatorId, calcTypeDynamic, (calcId) => {
                    detachCalculator(calcId, calcTypeDynamic)
                        .then((deleteResponse) => {
                            expect(deleteResponse.status).to.eq(200);
                            expect(deleteResponse.duration).to.be.lessThan(responseTimeLimit);
                            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                                .then((listResponse) => {
                                    expect(listResponse.status).to.eq(200);
                                    const list = Array.isArray(listResponse.body.body) ? listResponse.body.body : (listResponse.body.body.data || []);
                                    expect(list.find(c => c.id === calcId || c.calculator_id === calcId)).to.not.exist;
                                    expect(listResponse.duration).to.be.lessThan(responseTimeLimit);
                                });
                        });
                });
            });

            it('should return 404 when trying to delete an already-deleted calculator', () => {
                attachCalculator(calculatorId, calcTypeCalculator, (calcId) => {
                    detachCalculator(calcId, calcTypeCalculator)
                        .then((firstDelete) => {
                            expect(firstDelete.status).to.eq(200);
                            detachCalculator(calcId, calcTypeCalculator)
                                .then((response) => { expect(response.status).to.eq(404); expect(response.duration).to.be.lessThan(responseTimeLimit); });
                        });
                });
            });
        });

        describe('Calculator ID Verifications', () => {
            it('should return 404 for non-existent calculator_id', () => {
                detachCalculator(999999, calcTypeCalculator)
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for calculator_id as negative integer', () => {
                detachCalculator(-1, calcTypeCalculator)
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 417 for calculator_id as non-numeric string', () => {
                detachCalculator('invalid_id', calcTypeCalculator)
                    .then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for deleted calculator_id', () => {
                detachCalculator(deletedCalculatorId, calcTypeCalculator)
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for unpublished calculator_id', () => {
                detachCalculator(unpublishedCalculatorId, calcTypeCalculator)
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for calculator_id belonging to another reseller', () => {
                detachCalculator(anotherResellerCalculatorId, calcTypeCalculator)
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for unpublished dynamic-calculator_id', () => {
                detachCalculator(unpublishedDynamicCalculatorId, calcTypeDynamic)
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for dynamic-calculator_id belonging to a secondary site', () => {
                detachCalculator(secondarySiteDynamicCalculatorId, calcTypeDynamic)
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should reject calculator_id as security payload - ${key}`, () => {
                    detachCalculator(securityPayloads[key], calcTypeCalculator)
                        .then((r) => { expect(r.status).to.be.oneOf([404, 417]); expect(r.duration).to.be.lessThan(responseTimeLimit); });
                });
            });
        });

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                attachCalculator(calculatorId, calcTypeCalculator, (calcId) => {
                    detachCalculator(calcId, calcTypeCalculator, `/sites/999999/instances/${instanceId}/pages/${pageId}/calculators`)
                        .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
                });
            });

            it('should return 404 for deleted site_id', () => {
                attachCalculator(calculatorId, calcTypeCalculator, (calcId) => {
                    detachCalculator(calcId, calcTypeCalculator, `/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/calculators`)
                        .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
                });
            });

            it('should return 404 for non-existent instance_id', () => {
                attachCalculator(calculatorId, calcTypeCalculator, (calcId) => {
                    detachCalculator(calcId, calcTypeCalculator, `/sites/${site_id}/instances/999999/pages/${pageId}/calculators`)
                        .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
                });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                attachCalculator(calculatorId, calcTypeCalculator, (calcId) => {
                    detachCalculator(calcId, calcTypeCalculator, `/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/calculators`)
                        .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
                });
            });

            it('should return 404 for another reseller site_id', () => {
                attachCalculator(calculatorId, calcTypeCalculator, (calcId) => {
                    detachCalculator(calcId, calcTypeCalculator, `/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/calculators`)
                        .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
                });
            });
        });
    });

    // ─── GET List ─────────────────────────────────────────────────────────────

    describe('GET - List Page Calculators', () => {
        describe('Positive Scenarios', () => {
            it('should return 200 and a list for valid page', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return an array in the response body', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                    .then((response) => {
                        expect(response.status).to.eq(200);
                        const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                        expect(list).to.be.an('array');
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
            });

            it('should confirm attached Calculator appears in the list', () => {
                attachCalculator(calculatorId, calcTypeCalculator, (calcId) => {
                    cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                        .then((response) => {
                            expect(response.status).to.eq(200);
                            const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                            expect(list.find(c => c.id === calcId || c.calculator_id === calcId)).to.exist;
                            expect(response.duration).to.be.lessThan(responseTimeLimit);
                        });
                });
            });

            it('should confirm attached dynamic-calculator appears in the list', () => {
                attachCalculator(dynamicCalculatorId, calcTypeDynamic, (calcId) => {
                    cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                        .then((response) => {
                            expect(response.status).to.eq(200);
                            const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                            expect(list.find(c => c.id === calcId || c.calculator_id === calcId)).to.exist;
                            expect(response.duration).to.be.lessThan(responseTimeLimit);
                        });
                });
            });

            it('should list both attached Calculator and dynamic-calculator from the same endpoint', () => {
                attachCalculator(calculatorId, calcTypeCalculator, (regularCalcId) => {
                    attachCalculator(dynamicCalculatorId, calcTypeDynamic, (dynamicCalcId) => {
                        cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                            .then((response) => {
                                expect(response.status).to.eq(200);
                                const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                                expect(list.find(c => c.id === regularCalcId || c.calculator_id === regularCalcId)).to.exist;
                                expect(list.find(c => c.id === dynamicCalcId || c.calculator_id === dynamicCalcId)).to.exist;
                                expect(response.duration).to.be.lessThan(responseTimeLimit);
                            });
                    });
                });
            });
        });

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.GetItems(`/sites/999999/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/999999/pages/${pageId}/calculators`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/999999/calculators`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/calculators`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/calculators`, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });
});
