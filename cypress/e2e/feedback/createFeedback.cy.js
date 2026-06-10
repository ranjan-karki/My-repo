import { InputBody } from "../../support/inputBody";
import { messages } from "../../support/messages";
import { randomAlphaNumeric, randomNumber } from "../../utils/basicUtils";
import { securityPayloads } from "../../utils/securityPayloads";

describe('Token Reuse Demonstration', () => {
    let publicSiteToken;
    before(() => {
        cy.getPublicSitesToken().then((token) => {
            publicSiteToken = token;
        });
    });

    it('should response errror', () => {
        cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
            "", "", "", "", "", "", "", ""), { failOnStatusCode: false }).then((response) => {
                cy.expect(response.body.body.client_id[0]).to.eq(messages.feedback.clientIdRequired);
                cy.expect(response.body.body.event_name[0]).to.eq(messages.feedback.eventNameRequired);
                cy.expect(response.body.body.reseller_id[0]).to.eq(messages.feedback.resellerIdRequired);
                cy.expect(response.body.body.session_id[0]).to.eq(messages.feedback.sessionIdRequired);
                cy.expect(response.body.body.site_domain[0]).to.eq(messages.feedback.siteDomainRequired);
                cy.expect(response.body.body.site_type[0]).to.eq(messages.feedback.siteTypeRequired);
            });
    });
    it('should display validation errors for invalid data types', () => {
        cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
            0, "0", 0, "0", 0, 3, 0, 0), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417, "Expected 417 Validation Error but got: " + response.status + " Response Payload: " + JSON.stringify(response.body));
                cy.log(response.body.body);
                cy.expect(response.body.body.client_id[0]).to.eq(messages.feedback.clientIdInvalid);
                cy.expect(response.body.body.event_name[0]).to.eq(messages.feedback.eventNameInvalid);
                cy.expect(response.body.body.session_id[0]).to.eq(messages.feedback.sessionIdInvalid);
                cy.expect(response.body.body.site_domain[0]).to.eq(messages.feedback.siteDomainString);
                cy.expect(response.body.body.site_type[0]).to.eq(messages.feedback.siteTypeInvalid);
                cy.expect(response.body.body.rating[0]).to.eq(messages.feedback.ratingAtLeast);
            });
    });

    describe('Positive Scenarios', () => {
        it('should submit feedback with valid random data', () => {
            const clientId = randomAlphaNumeric(26);
            const sessionId = randomAlphaNumeric(26);
            const eventName = "feedback_submitted";
            const resellerId = randomNumber(6);
            const domain = randomAlphaNumeric(8) + ".com";
            const siteType = 1;
            const rating = 5;
            const pages = [
                {
                    "id": randomNumber(5),
                    "title": randomAlphaNumeric(20),
                    "is_liked": true
                }
            ];

            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, eventName, resellerId, domain, siteType, rating, pages
            ), { failOnStatusCode: false }).then((response) => {
                cy.log("Positive Test Response:", response.body);
            });
        });

        it('should submit feedback with specified user payload', () => {
            const pages = [
                {
                    "id": 999999999999999999,
                    "title": "99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999'",
                    "is_liked": 1
                },
                {
                    "id": 105,
                    "title": "Customer Support",
                    "is_liked": false
                },
                {
                    "id": 111,
                    "title": "Who We Are",
                    "is_liked": true
                }
            ];

            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                "01KN3MBDMHCF8Q688WZB45NQ6X", "01KN3MBDMJZAGA3S7SQKB0K665", "feedback_submitted", 797979, "mercer", 1, 6, pages
            ), { failOnStatusCode: false }).then((response) => {
                cy.log("User Payload Test Response:", response.body);
            });
        });
    });

    describe('Security Scenarios', () => {
        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle ${key} payload in feedback pages title field`, () => {
                const payload = securityPayloads[key];
                const pages = [
                    {
                        "id": randomNumber(5),
                        "title": payload, // Malicious page title
                        "is_liked": true
                    }
                ];

                cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                    randomAlphaNumeric(26), // client_id
                    randomAlphaNumeric(26), // session_id
                    "feedback_submitted", // event_name
                    randomNumber(6), // reseller_id
                    randomAlphaNumeric(8) + ".com", // site_domain
                    1, // site_type
                    5, // rating
                    pages // pages with payload
                ), { failOnStatusCode: false }).then((response) => {
                    cy.log(`Security Test ${key} Response:`, response.body);
                    // Assert it doesn't fail with 500 or expose sensitive info (basic checks)
                    expect(response.status).to.not.eq(500);
                });
            });
        });
    });
});
