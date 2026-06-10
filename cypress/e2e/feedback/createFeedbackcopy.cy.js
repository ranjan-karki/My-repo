import { InputBody } from "../../support/inputBody";
import { messages } from "../../support/messages";
import { randomAlphaNumeric, randomNumber } from "../../utils/basicUtils";
import { securityPayloads } from "../../utils/securityPayloads";

describe('Create Feedback Tests', () => {
    let publicSiteToken;
    const site_domain = "mercer";
    let clientId;
    let sessionId;

    before(() => {
        cy.getPublicSitesToken().then((token) => {
            publicSiteToken = token;
        });

        cy.generateUUID().then((id) => {
            clientId = id;
        });

        cy.generateUUID().then((id) => {
            sessionId = id;
        });
    });

    const defaultPages = [
        {
            "id": randomNumber(5),
            "title": randomAlphaNumeric(20),
            "is_liked": true
        }
    ];

    describe('Client ID Verifications', () => {
        it('should verify valid client_id, response is true', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.be.oneOf([200, 201]);
                // cy.log("Valid Client ID Response:", response.body);
            });
        });

         it('should verify invalid client_id: pass int', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                12345, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                // cy.expect(response.body.body.client_id[0]).to.eq(messages.feedback.clientIdInvalid);
            });
        });

        it('should verify invalid client_id: invalid strings', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                "invalid-string", sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.client_id[0]).to.eq(messages.feedback.clientIdInvalid);
            });
        });

        it('should verify invalid client_id: large int', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                9999999999999999, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.client_id[0]).to.eq(messages.feedback.clientIdInvalid);
            });
        });

        it('should verify invalid client_id: chars', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                "!@#$%^&*", sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.client_id[0]).to.eq(messages.feedback.clientIdInvalid);
            });
        });

        it('should handle security verification in client_id input: xss', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                securityPayloads.xss, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.client_id[0]).to.eq(messages.feedback.clientIdInvalid);
            });
        });

        it('should handle security verification in client_id input: sql', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                securityPayloads.sql, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.client_id[0]).to.eq(messages.feedback.clientIdInvalid);
            });
        });

        it('should handle security verification in client_id input: specialCharString', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                securityPayloads.specialCharString, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.client_id[0]).to.eq(messages.feedback.clientIdInvalid);
            });
        });

        it('should handle security verification in client_id input: pathTraversal', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                securityPayloads.pathTraversal, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.client_id[0]).to.eq(messages.feedback.clientIdInvalid);
            });
        });
    });

    describe('Session ID Verifications', () => {
        it('should verify invalid session_id: pass int', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, 12345, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.session_id[0]).to.eq(messages.feedback.sessionIdInvalid);
            });
        });

        it('should verify invalid session_id: invalid strings', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, "invalid-string", "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.session_id[0]).to.eq(messages.feedback.sessionIdInvalid);
            });
        });

        it('should verify invalid session_id: large int', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, 9999999999999999, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.session_id[0]).to.eq(messages.feedback.sessionIdInvalid);
            });
        });

        it('should verify invalid session_id: chars', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, "!@#$%^&*", "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.session_id[0]).to.eq(messages.feedback.sessionIdInvalid);
            });
        });

        it('should handle security verification in session_id input: xss', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, securityPayloads.xss, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.session_id[0]).to.eq(messages.feedback.sessionIdInvalid);
            });
        });

        it('should handle security verification in session_id input: sql', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, securityPayloads.sql, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.session_id[0]).to.eq(messages.feedback.sessionIdInvalid);
            });
        });

        it('should handle security verification in session_id input: specialCharString', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, securityPayloads.specialCharString, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.session_id[0]).to.eq(messages.feedback.sessionIdInvalid);
            });
        });

        it('should handle security verification in session_id input: pathTraversal', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, securityPayloads.pathTraversal, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.session_id[0]).to.eq(messages.feedback.sessionIdInvalid);
            });
        });

        it('should verify session_id and client_id cannot be same', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, clientId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.log("Same Client/Session ID Validation:", response.body);
            });
        });
    });

    describe('Event Name Verifications', () => {
        it('should verify invalid event_name: pass int', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, 123, randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.event_name[0]).to.eq(messages.feedback.eventNameInvalid);
            });
        });

        it('should verify invalid event_name: random string', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "random_event_name", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.event_name[0]).to.eq(messages.feedback.eventNameInvalid);
            });
        });

        it('should verify invalid event_name: empty string', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "", randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.event_name[0]).to.eq(messages.feedback.eventNameRequired);
            });
        });

        it('should handle security verification in event_name input: xss', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, securityPayloads.xss, randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.event_name[0]).to.eq(messages.feedback.eventNameInvalid);
            });
        });

        it('should handle security verification in event_name input: sql', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, securityPayloads.sql, randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.event_name[0]).to.eq(messages.feedback.eventNameInvalid);
            });
        });

        it('should handle security verification in event_name input: specialCharString', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, securityPayloads.specialCharString, randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.event_name[0]).to.eq(messages.feedback.eventNameInvalid);
            });
        });

        it('should handle security verification in event_name input: pathTraversal', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, securityPayloads.pathTraversal, randomNumber(6), site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.event_name[0]).to.eq(messages.feedback.eventNameInvalid);
            });
        });
    });

    describe('Reseller ID Verifications', () => {
        it('should verify invalid reseller_id: string type', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", "1234", site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.reseller_id[0]).to.eq(messages.feedback.resellerIdInvalid);
            });
        });

        it('should verify invalid reseller_id: float', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", 1.25, site_domain, 1, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.reseller_id[0]).to.eq(messages.feedback.resellerIdInvalid);
            });
        });
    });

    describe('Site Type Verifications', () => {
        it('should verify invalid site_type: string type', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, "1", 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.site_type[0]).to.eq(messages.feedback.siteTypeInvalid);
            });
        });

        it('should verify invalid site_type: float', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1.5, 5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.site_type[0]).to.eq(messages.feedback.siteTypeInvalid);
            });
        });
    });

    describe('Rating Verifications', () => {
        it('should verify invalid rating: less than 1', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 0, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.rating[0]).to.eq(messages.feedback.ratingAtLeast);
            });
        });

        it('should verify invalid rating: greater than 5', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 6, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.rating[0]).to.eq(messages.feedback.ratingAtMost);
            });
        });

        it('should verify invalid rating: string type', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, "5", defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.rating[0]).to.eq(messages.feedback.ratingInteger);
            });
        });

        it('should verify invalid rating: float', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 3.5, defaultPages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body.rating[0]).to.eq(messages.feedback.ratingInteger);
            });
        });
    });

    describe('Feedback Pages Input Verifications', () => {
        it('pages can be empty', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, []
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.be.oneOf([200, 201]);
            });
        });

        it('fail if empty object is passed', () => {
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, [{}]
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.status.message).to.eq("Please correct the errors and try again.");
                expect(response.body.status.code).to.eq("form_validation_error");
                expect(response.body.status.code_text).to.eq("form validation failed");

                cy.expect(response.body.body["feedback.pages.0.id"][0]).to.eq("The feedback.pages.0.id field is required.");
                cy.expect(response.body.body["feedback.pages.0.title"][0]).to.eq("The feedback.pages.0.title field is required.");
                cy.expect(response.body.body["feedback.pages.0.is_liked"][0]).to.eq("The feedback.pages.0.is_liked field is required.");
            });
        });

        it('verify title max character limit is 255', () => {
            const pages = [{
                "id": randomNumber(5),
                "title": randomAlphaNumeric(256),
                "is_liked": true
            }];
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, pages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body["feedback.pages.0.title"][0]).to.eq("The feedback.pages.0.title may not be greater than 255 characters.");
            });
        });

        it('verify invalid type for id property inside pages objects', () => {
            const pages = [{
                "id": "invalid_id_string", // invalid
                "title": randomAlphaNumeric(20), // valid
                "is_liked": true // valid
            }];
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, pages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.log("Pages Invalid ID Valuation Response:", response.body);
            });
        });

        it('verify invalid type for title property inside pages objects', () => {
            const pages = [{
                "id": randomNumber(5), // valid
                "title": 12345, // invalid
                "is_liked": true // valid
            }];
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, pages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body["feedback.pages.0.title"][0]).to.eq(messages.feedback.pageTitleString);
            });
        });

        it('verify invalid type for is_liked property inside pages objects', () => {
            const pages = [{
                "id": randomNumber(5), // valid
                "title": randomAlphaNumeric(20), // valid
                "is_liked": "string_not_boolean" // invalid
            }];
            cy.PostPublic('/open/events/feedbacks', publicSiteToken, InputBody.feedbacks(
                clientId, sessionId, "feedback_submitted", randomNumber(6), site_domain, 1, 5, pages
            ), { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                cy.expect(response.body.body["feedback.pages.0.is_liked"][0]).to.eq(messages.feedback.pageIsLikedBoolean);
            });
        });
    });
});
