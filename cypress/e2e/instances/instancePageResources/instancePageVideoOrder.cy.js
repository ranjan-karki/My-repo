import { messages } from "../../../support/messages";
import { InputBody } from "../../../support/inputBody";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS, Videos_ids } from "../../../support/testConfig";

describe('Instance Page Video Order Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedVideoId, unpublished: unpublishedVideoId, secondarSiteVideo: secondarySiteVideoId, AnotherResellerVidoe: anotherResellerVideoId } = Videos_ids;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout       = THEMES.theme1;
    const primaryColor      = '#123456';
    const secondaryColor    = '#654321';
    const displayLogoTrue   = true;

    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

    const orderEndpoint  = () => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/order`;
    const listEndpoint   = () => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos`;
    const assignEndpoint = (videoId) => `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}`;

    let instanceId;
    let pageId;
    let anotherInstancePageId;
    let videos = [];

    const assignAllVideos = () => {
        videos.forEach((v, i) => {
            cy.Put(assignEndpoint(v.id), { order: i + 1, version_id: null }, { failOnStatusCode: false })
                .then((r) => { expect(r.status).to.eq(200); });
        });
    };

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

        cy.GetItems(`/sites/${site_id}/available-videos`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            videos = response.body.body.data.map(v => ({ id: v.id, version_id: v.version_id ?? null }));
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
        assignAllVideos();
    });

    // ─── Positive Scenarios ───────────────────────────────────────────────────

    // The GET list, filtered to the ids we sent, should come back in exactly the
    // sequence those ids were sent in.
    const expectListInOrder = (getResponse, ids) => {
        expect(getResponse.status).to.eq(200);
        const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data ?? []);
        const returned = list.map(v => v.id).filter(id => ids.includes(id));
        expect(returned).to.deep.eq(ids);
    };

    describe('Positive Scenarios', () => {
        it('should reorder videos with shuffled ids and GET returns them in that sequence', () => {
            const ids = shuffle(videos.map(v => v.id));
            cy.Put(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.GetItems(listEndpoint(), { failOnStatusCode: false }).then((getResponse) => {
                    expectListInOrder(getResponse, ids);
                    expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should reorder videos to reverse sequence and GET returns the reversed order', () => {
            const ids = videos.map(v => v.id).reverse();
            cy.Put(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                cy.GetItems(listEndpoint(), { failOnStatusCode: false }).then((getResponse) => {
                    expectListInOrder(getResponse, ids);
                });
            });
        });

        it('should reorder with a single id in the array', () => {
            cy.Put(orderEndpoint(), { ids: [videos[0].id] }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should be idempotent when same id order is sent twice', () => {
            const ids = shuffle(videos.map(v => v.id));
            cy.Put(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((first) => {
                expect(first.status).to.eq(200);
                cy.Put(orderEndpoint(), { ids }, { failOnStatusCode: false }).then((second) => {
                    expect(second.status).to.eq(200);
                    expect(second.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        it('should accept extra/unexpected fields in payload alongside ids (fields ignored)', () => {
            const ids = shuffle(videos.map(v => v.id));
            cy.Put(orderEndpoint(), { ids, extra_field: 'ignored', another: 123 }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Body Validations ─────────────────────────────────────────────────────

    describe('Body Validations', () => {
        it('should return 417 for empty JSON payload', () => {
            cy.Put(orderEndpoint(), {}, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 417 when ids key is missing from payload', () => {
            cy.Put(orderEndpoint(), { order: [1, 2, 3] }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 417 when ids is a non-array string', () => {
            cy.Put(orderEndpoint(), { ids: 'invalid' }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 417 when ids is an integer', () => {
            cy.Put(orderEndpoint(), { ids: 123 }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 417 when ids contains a non-numeric value', () => {
            cy.Put(orderEndpoint(), { ids: ['invalid'] }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 417 when ids contains a decimal value', () => {
            cy.Put(orderEndpoint(), { ids: [1.5] }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 417 when ids contains a null value', () => {
            cy.Put(orderEndpoint(), { ids: [null] }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 417 or 422 when ids contains duplicate ids', () => {
            cy.Put(orderEndpoint(), {
                ids: [videos[0].id, videos[0].id]
            }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.be.oneOf([417, 422]);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 or 422 when ids contains a non-existent video id', () => {
            cy.Put(orderEndpoint(), { ids: [999999] }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.be.oneOf([404, 422]);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when ids contains a deleted video id', () => {
            cy.Put(orderEndpoint(), { ids: [deletedVideoId] }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when ids contains an unpublished video id', () => {
            cy.Put(orderEndpoint(), { ids: [unpublishedVideoId] }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when ids contains a secondary-site video id', () => {
            cy.Put(orderEndpoint(), { ids: [secondarySiteVideoId] }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 when ids contains another reseller video id', () => {
            cy.Put(orderEndpoint(), { ids: [anotherResellerVideoId] }, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── URL Path Verifications ───────────────────────────────────────────────

    describe('URL Path Verifications', () => {
        const validIds = () => videos.map(v => v.id);

        it('should return 404 for non-existent site_id', () => {
            cy.Put(`/sites/999999/instances/${instanceId}/pages/${pageId}/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for deleted site_id', () => {
            cy.Put(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for another reseller site_id', () => {
            cy.Put(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for non-numeric site_id', () => {
            cy.Put(`/sites/invalid_site/instances/${instanceId}/pages/${pageId}/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for non-existent instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/999999/pages/${pageId}/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for non-numeric instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/invalid_instance/pages/${pageId}/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for negative instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/-1/pages/${pageId}/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for non-existent page_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/999999/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                cy.expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for page_id belonging to another instance', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for non-numeric page_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/invalid_page/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for negative page_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/-1/videos/order`,
                { ids: validIds() }, { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Security – URL Path ──────────────────────────────────────────────────

    describe('Security - URL Path Parameter', () => {
        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 for security payload as site_id - ${key}`, () => {
                cy.Put(`/sites/${encodeURIComponent(securityPayloads[key])}/instances/${instanceId}/pages/${pageId}/videos/order`,
                    { ids: [] }, { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 for security payload as instance_id - ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${encodeURIComponent(securityPayloads[key])}/pages/${pageId}/videos/order`,
                    { ids: [] }, { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should return 404 for security payload as page_id - ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads[key])}/videos/order`,
                    { ids: [] }, { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── HTTP Method Validation ───────────────────────────────────────────────

    describe('HTTP Method Validation', () => {
        it('should return 405 for GET request to /order endpoint', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/order`,
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for POST request to /order endpoint', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/order`,
                { ids: videos.map(v => v.id) },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for DELETE request to /order endpoint', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/order`,
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });
});
