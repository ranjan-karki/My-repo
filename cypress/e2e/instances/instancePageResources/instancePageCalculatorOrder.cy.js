import { messages } from "../../../support/messages";
import { InputBody } from "../../../support/inputBody";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS, CALCULATOR_IDs } from "../../../support/testConfig";

describe('Instance Page Calculator Order Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedCalculatorId, unpublish: unpublishedCalculatorId, AnotherResellerCalculator: anotherResellerCalculatorId, unpublishedDynamcCalculator: unpublishedDynamicCalculatorId, secondarySiteDynamicCalculator: secondarySiteDynamicCalculatorId } = CALCULATOR_IDs;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout       = THEMES.theme1;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    const displayLogoTrue   = true;
    const calcTypeCalculator = 'Calculator';

    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

    let instanceId;
    let pageId;
    let anotherInstancePageId;
    let calculatorIds = [];

    const orderEndpoint = () => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators/order`;
    const listEndpoint  = () => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`;

    before(() => {
        cy.loginAndGetToken();

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: `Page ${randomAlphaNumeric(5)}`, status: true }, { failOnStatusCode: false }
            ).then((pageResponse) => {
                expect(pageResponse.status).to.eq(200);
                pageId = pageResponse.body.body.id;

                // Fetch available calculators then attach the first 4 to the page
                cy.GetItems(`/calculators`, { failOnStatusCode: false }).then((calcResponse) => {
                    expect(calcResponse.status).to.eq(200);
                    const calcIds = (calcResponse.body.body.data || []).map(c => c.id);

                    for (let i = 0; i < 4; i++) {
                        cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/calculators`,
                            InputBody.instancePageCalculators(calcIds[i], calcTypeCalculator, i + 1),
                            { failOnStatusCode: false }
                        ).then((r) => { expect(r.status).to.eq(200); });
                    }

                    cy.GetItems(listEndpoint(), { failOnStatusCode: false }).then((listResponse) => {
                        const list = Array.isArray(listResponse.body.body) ? listResponse.body.body : (listResponse.body.body.data || []);
                        calculatorIds = list.map(c => c.id);
                    });
                });
            });
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
    });

    beforeEach(() => { cy.loginAndGetToken(); });

    // The GET list, filtered to the ids we sent, should come back in exactly the
    // sequence those ids were sent in.
    const expectListInOrder = (getResponse, ids) => {
        expect(getResponse.status).to.eq(200);
        const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data ?? []);
        const returned = list.map(c => c.id).filter(id => ids.includes(id));
        expect(returned).to.deep.eq(ids);
    };

    describe('Positive Scenarios', () => {
        it('should reorder calculators with shuffled ids and GET returns them in that sequence', () => {
            const ids = shuffle(calculatorIds);
            cy.Post(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.GetItems(listEndpoint(), { failOnStatusCode: false }).then((getResponse) => {
                    expectListInOrder(getResponse, ids);
                    expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should reorder calculators to reverse sequence and GET returns the reversed order', () => {
            const ids = [...calculatorIds].reverse();
            cy.Post(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.GetItems(listEndpoint(), { failOnStatusCode: false }).then((getResponse) => {
                    expectListInOrder(getResponse, ids);
                });
            });
        });

        it('should reorder with a single id in the array', () => {
            cy.Post(orderEndpoint(), { ids: [calculatorIds[0]] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(200); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should be idempotent when same id order is sent twice', () => {
            const ids = shuffle(calculatorIds);
            cy.Post(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((first) => {
                expect(first.status).to.eq(200);
                cy.Post(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((second) => {
                    expect(second.status).to.eq(200);
                    expect(second.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('Body Validations', () => {
        it('should return 417 for empty JSON payload', () => {
            cy.Post(orderEndpoint(), {}, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids key is missing', () => {
            cy.Post(orderEndpoint(), { items: [] }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids is a non-array string', () => {
            cy.Post(orderEndpoint(), { ids: 'invalid' }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids is an integer', () => {
            cy.Post(orderEndpoint(), { ids: 123 }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids contains a non-numeric value', () => {
            cy.Post(orderEndpoint(), { ids: ['invalid'] }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids contains a decimal value', () => {
            cy.Post(orderEndpoint(), { ids: [1.5] }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 when ids contains a null value', () => {
            cy.Post(orderEndpoint(), { ids: [null] }, { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(417); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 417 or 422 when ids contains duplicate ids', () => {
            cy.Post(orderEndpoint(), { ids: [calculatorIds[0], calculatorIds[0]] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.be.oneOf([417, 422]); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains a deleted calculator id', () => {
            cy.Post(orderEndpoint(), { ids: [deletedCalculatorId] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains an unpublished calculator id', () => {
            cy.Post(orderEndpoint(), { ids: [unpublishedCalculatorId] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains another reseller calculator id', () => {
            cy.Post(orderEndpoint(), { ids: [anotherResellerCalculatorId] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains an unpublished dynamic-calculator id', () => {
            cy.Post(orderEndpoint(), { ids: [unpublishedDynamicCalculatorId] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 when ids contains a secondary-site dynamic-calculator id', () => {
            cy.Post(orderEndpoint(), { ids: [secondarySiteDynamicCalculatorId] }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('URL Path Verifications', () => {
        const validIds = () => calculatorIds;

        it('should return 404 for non-existent site_id', () => {
            cy.Post(`/sites/999999/instances/${instanceId}/pages/${pageId}/calculators/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for deleted site_id', () => {
            cy.Post(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/calculators/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for another reseller site_id', () => {
            cy.Post(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/calculators/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for non-existent instance_id', () => {
            cy.Post(`/sites/${site_id}/instances/999999/pages/${pageId}/calculators/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for non-existent page_id', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/999999/calculators/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); cy.expect(r.body.status.message).to.eq(messages.notFound); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 404 for page_id belonging to another instance', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/calculators/order`, { ids: validIds() }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });

    describe('Security - URL Path Parameter', () => {
        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 for security payload as site_id - ${key}`, () => {
                cy.Post(`/sites/${encodeURIComponent(securityPayloads[key])}/instances/${instanceId}/pages/${pageId}/calculators/order`, { ids: [] }, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 for security payload as page_id - ${key}`, () => {
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads[key])}/calculators/order`, { ids: [] }, { failOnStatusCode: false })
                    .then((r) => { expect(r.status).to.eq(404); expect(r.duration).to.be.lessThan(responseTimeLimit); });
            });
        });
    });

    describe('HTTP Method Validation', () => {
        it('should return 405 for GET request to /order endpoint', () => {
            cy.GetItems(orderEndpoint(), { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });

        it('should return 405 for DELETE request to /order endpoint', () => {
            cy.Delete(orderEndpoint(), { failOnStatusCode: false }).then((r) => { expect(r.status).to.eq(405); expect(r.duration).to.be.lessThan(responseTimeLimit); });
        });
    });
});
