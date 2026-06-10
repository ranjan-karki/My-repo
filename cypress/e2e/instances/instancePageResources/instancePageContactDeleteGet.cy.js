import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { InputBody } from "../../../support/inputBody";
import { SITES, THEMES, TIMEOUTS, CONTACT_IDs } from "../../../support/testConfig";

describe('Delete and Get Instance Page Contact Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedContactId, unpublished: unpublishedContactId, secondarSiteContact: secondarySiteContactId, resellerContact: anotherResellerContactId } = CONTACT_IDs;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout       = THEMES.theme1;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    const displayLogoTrue   = true;
    const Order             = 1;

    let instanceId;
    let pageId;
    let anotherInstancePageId;
    let anotherSiteInstanceId;
    let contacts     = [];
    let sharedContactId;
    let contactIndex = 0;

    const getNextContact = () => contacts[contactIndex++];

    before(() => {
        cy.loginAndGetToken();

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            instanceId = response.body.body.id;

            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages`,
                { title: `Page ${randomAlphaNumeric(5)}`, status: true },
                { failOnStatusCode: false }
            ).then((pageResponse) => {
                expect(pageResponse.status).to.eq(200);
                pageId = pageResponse.body.body.id;
            });
        });

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            const otherInstanceId = response.body.body.id;

            cy.Post(`/sites/${site_id}/instances/${otherInstanceId}/pages`,
                { title: `Other Page ${randomAlphaNumeric(5)}`, status: true },
                { failOnStatusCode: false }
            ).then((pageResponse) => {
                expect(pageResponse.status).to.eq(200);
                anotherInstancePageId = pageResponse.body.body.id;
            });
        });

        cy.GetItems(`/sites/${another_reseller_site}/instances`, { failOnStatusCode: false }).then((response) => {
            if (response.status === 200 && response.body.body.length > 0) {
                anotherSiteInstanceId = response.body.body[0].id;
            }
        });

        cy.GetItems(`/v2/sites/${site_id}/available-contacts`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            contacts        = response.body.body.data.map(c => ({ id: c.id }));
            sharedContactId = contacts[0].id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // ─── DELETE ───────────────────────────────────────────────────────────────

    describe('DELETE - Detach Contact from Page', () => {
        describe('Positive Scenarios', () => {
            it('should detach contact successfully', () => {
                const { id: contactId } = getNextContact();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${contactId}`,
                    { order: Order }, { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${contactId}`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });

            it('should confirm contact is no longer in list after detach', () => {
                const { id: contactId } = getNextContact();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${contactId}`,
                    { order: Order }, { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${contactId}`,
                        { failOnStatusCode: false }
                    ).then((deleteResponse) => {
                        expect(deleteResponse.status).to.eq(200);
                        cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts`,
                            { failOnStatusCode: false }
                        ).then((listResponse) => {
                            expect(listResponse.status).to.eq(200);
                            const list = Array.isArray(listResponse.body.body) ? listResponse.body.body : (listResponse.body.body.data || []);
                            expect(list.find(c => c.id === contactId)).to.not.exist;
                            expect(listResponse.duration).to.be.lessThan(responseTimeLimit);
                        });
                    });
                });
            });

            it('should return 404 when trying to detach an already-detached contact', () => {
                const { id: contactId } = getNextContact();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${contactId}`,
                    { order: Order }, { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${contactId}`,
                        { failOnStatusCode: false }
                    ).then((firstDelete) => {
                        expect(firstDelete.status).to.eq(200);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${contactId}`,
                            { failOnStatusCode: false }
                        ).then((response) => {
                            expect(response.status).to.eq(404);
                            expect(response.duration).to.be.lessThan(responseTimeLimit);
                        });
                    });
                });
            });
        });

        describe('Contact ID Verifications', () => {
            it('should return 404 for non-existent contact_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/999999`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for contact_id as negative integer', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/-1`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for contact_id as non-numeric string', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/invalid_id`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for contact not attached to this page', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${sharedContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for deleted contact_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${deletedContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for unpublished contact_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${unpublishedContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for contact_id belonging to a secondary site', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${secondarySiteContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for contact_id belonging to another reseller', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${anotherResellerContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for contact_id as security payload - ${key}`, () => {
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${encodeURIComponent(securityPayloads[key])}`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.Delete(`/sites/999999/instances/${instanceId}/pages/${pageId}/contacts/${sharedContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for deleted site_id', () => {
                cy.Delete(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/contacts/${sharedContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.Delete(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/contacts/${sharedContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.Delete(`/sites/${site_id}/instances/999999/pages/${pageId}/contacts/${sharedContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/999999/contacts/${sharedContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/contacts/${sharedContactId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── GET List ─────────────────────────────────────────────────────────────

    describe('GET - List Page Contacts', () => {
        describe('Positive Scenarios', () => {
            it('should return 200 and a list for valid page', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return an array in the response body', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                    expect(list).to.be.an('array');
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should confirm attached contact appears in the list', () => {
                const { id: contactId } = getNextContact();
                cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts/${contactId}`,
                    { order: Order }, { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                        expect(list.find(c => c.id === contactId)).to.exist;
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });

            it('should return response with valid status object', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/contacts`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.status).to.have.property('code');
                    expect(response.body.status.code).to.eq('ok');
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.GetItems(`/sites/999999/instances/${instanceId}/pages/${pageId}/contacts`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for deleted site_id', () => {
                cy.GetItems(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/contacts`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/contacts`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/999999/pages/${pageId}/contacts`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/999999/contacts`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/contacts`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });
});
