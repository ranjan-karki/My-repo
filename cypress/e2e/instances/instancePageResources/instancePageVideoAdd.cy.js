import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS, Videos_ids } from "../../../support/testConfig";

describe('Add Instance Page Video Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedVideoId, unpublished: unpublishedVideoId, secondarSiteVideo: secondarySiteVideoId, AnotherResellerVidoe: anotherResellerVideoId } = Videos_ids;
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
    let video_ids = [];
    let sharedVideoId;
    let videoIdIndex = 1;

    const getNextVideoId = () => video_ids[videoIdIndex++ % video_ids.length];

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

        cy.GetItems(`/sites/${site_id}/available-videos`, { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            video_ids = response.body.body.data.map(v => v.id);
            sharedVideoId = video_ids[0];
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // ─── Order Field - Valid ──────────────────────────────────────────────────
    describe('Order Field - Valid', () => {
        it('should assign video with valid order value', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${getNextVideoId()}`,
                InputBody.homepageVideos(5, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body).to.eq(true);
                expect(response.body.status.code).to.eq('ok');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should assign video with order as 1', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${getNextVideoId()}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should assign video with order as 0', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${getNextVideoId()}`,
                InputBody.homepageVideos(0, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should assign video with order as large positive integer (999)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${getNextVideoId()}`,
                InputBody.homepageVideos(999, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Order Field - Invalid ────────────────────────────────────────────────
    describe('Order Field - Invalid', () => {
        it('should reject order as empty value', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos('', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as null', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as negative integer (-1)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(-1, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.homepageVideos.orderMin);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as large negative integer (-999)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(-999, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.homepageVideos.orderMin);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as string type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(getRandomSubstring(5), null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as decimal (1.5)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(1.5, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as boolean true', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(true, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as boolean false', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(false, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as very long integer (exceeds int limit)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(999999999999999, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderMaxDigits);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in order input: ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                    InputBody.homepageVideos(securityPayloads[key], null),
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
            cy.Put(`/sites/999999/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for deleted site_id', () => {
            cy.Put(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for another reseller site_id', () => {
            cy.Put(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for site_id as string type', () => {
            cy.Put(`/sites/invalid_site/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for site_id as negative integer', () => {
            cy.Put(`/sites/-1/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── URL Param - Instance ─────────────────────────────────────────────────

    describe('URL Param - Instance', () => {
        it('should return 404 for non-existent instance_id', () => {
            cy.Put(`/sites/${site_id}/instances/999999/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for instance_id belonging to another site', () => {
            cy.Put(`/sites/${site_id}/instances/${anotherSiteInstanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for instance_id as string type', () => {
            cy.Put(`/sites/${site_id}/instances/invalid_id/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for instance_id as negative integer', () => {
            cy.Put(`/sites/${site_id}/instances/-1/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── URL Param - Page ─────────────────────────────────────────────────────

    describe('URL Param - Page', () => {
        it('should return 404 for non-existent page_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/999999/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for page_id belonging to another instance', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.body.status.message).to.eq(messages.notFound);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for page_id as string type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/invalid_page/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for page_id as negative integer', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/-1/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for page_id as zero', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/0/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── URL Param - Video ────────────────────────────────────────────────────

    describe('URL Param - Video', () => {
        it('should assign video with valid video_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${getNextVideoId()}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 403 for non-existent video_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/999999`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(403);
                expect(response.body.status.code_text).to.eq("forbidden");
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for video_id as string type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/invalid_video`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for video_id as negative integer', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/-1`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for empty video_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for video_id as decimal', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/1.5`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for deleted video_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${deletedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for unpublished video_id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${unpublishedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for video_id belonging to a secondary site', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${secondarySiteVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for video_id belonging to another reseller', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${anotherResellerVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── URL Param - Security ─────────────────────────────────────────────────

    describe('URL Param - Security', () => {
        it('should return 404 for site_id as JS script injection', () => {
            cy.Put(`/sites/${encodeURIComponent(securityPayloads.xss)}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for instance_id as SQL injection', () => {
            cy.Put(`/sites/${site_id}/instances/${encodeURIComponent(securityPayloads.sql)}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for page_id as directory traversal', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${encodeURIComponent(securityPayloads.pathTraversal)}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for video_id as directory traversal', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${encodeURIComponent(securityPayloads.pathTraversal)}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Duplicate and Conflict ───────────────────────────────────────────────

    describe('Duplicate and Conflict', () => {
        it('should return 200 when assigning same video twice to the same page (ignored)', () => {
            const videoId = getNextVideoId();
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((firstResponse) => {
                expect(firstResponse.status).to.eq(200);
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}`,
                    InputBody.homepageVideos(Order, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);

                    cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos`, { failOnStatusCode: false }).then((getResponse) => {
                        expect(getResponse.status).to.eq(200);
                        const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data || []);
                        const matches = list.filter(v => v.id === videoId);
                        expect(matches.length).to.eq(1);
                    });
                });
            });
        });

        it('should add video and resequence when order conflicts with existing video', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${getNextVideoId()}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should add video at end of list when order exceeds current video count', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${getNextVideoId()}`,
                InputBody.homepageVideos(9999, null),
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
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                {},
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 417 for malformed JSON payload', () => {
            cy.request({
                method: 'PUT',
                url: `/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                headers: {
                    Authorization: `Bearer ${Cypress.env('token')}`,
                    'Content-Type': 'application/json'
                },
                body: '{ order: }',
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.body.body.version_id[0]).to.eq(messages.homepageVideos.versionIdPresent);
            });
        });

        it('should assign video and ignore extra/unexpected fields in payload', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${getNextVideoId()}`,
                { ...InputBody.homepageVideos(Order, null), extra_field: 'test' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for GET request to PUT endpoint', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for POST request to PUT endpoint', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    // ─── Response Validation ──────────────────────────────────────────────────

    describe('Response Validation', () => {
        it('should return correct response body structure on successful PUT', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${getNextVideoId()}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.body).to.eq(true);
                expect(response.body.status.message).to.eq('Okay');
                expect(response.body.status.code).to.eq('ok');
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should verify video appears in GET list after successful PUT', () => {
            const videoId = getNextVideoId();
            cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}`,
                InputBody.homepageVideos(2, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos`,
                    { failOnStatusCode: false }
                ).then((getResponse) => {
                    expect(getResponse.status).to.eq(200);
                    const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data || []);
                    const found = list.find(v => v.id === videoId);
                    expect(found).to.exist;
                    expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });
});
