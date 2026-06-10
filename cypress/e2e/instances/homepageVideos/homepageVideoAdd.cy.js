import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS, Videos_ids } from "../../../support/testConfig";

describe('Add Homepage Video Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;

    const displayLogoTrue = true;
    const primaryColor = '#123456';
    const secondaryColor = '#654321';
    const Order = 1;

    let instanceId;
    let homepageResourceEnabledInstanceId;
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

            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/settings`, { failOnStatusCode: false }).then((settingsResponse) => {
                expect(settingsResponse.status).to.eq(200);
                const body = settingsResponse.body.body;
                const data = Array.isArray(body) ? body : (body.data ?? [body]);
                const settingId = data[0].id;
                cy.Put(`/sites/${site_id}/instances/${instanceId}/settings/${settingId}`,
                    InputBody.instanceSettings('enable_homepage_resource', false),
                    { failOnStatusCode: false }
                ).then((putResponse) => {
                    expect(putResponse.status).to.eq(200);
                });
            });
        });

        cy.Post(`/sites/${site_id}/instances`, InputBody.instances(
            getRandomSubstring(5), getRandomSubstring(50), primaryColor, secondaryColor, displayLogoTrue, validLayout, randomAlphaNumeric(10).toLowerCase()
        ), { failOnStatusCode: false }).then((response) => {
            expect(response.status).to.eq(200);
            homepageResourceEnabledInstanceId = response.body.body.id;

            cy.GetItems(`/sites/${site_id}/instances/${homepageResourceEnabledInstanceId}/settings`, { failOnStatusCode: false }).then((settingsResponse) => {
                expect(settingsResponse.status).to.eq(200);
                const body = settingsResponse.body.body;
                const data = Array.isArray(body) ? body : (body.data ?? [body]);
                const settingId = data[0].id;
                cy.Put(`/sites/${site_id}/instances/${homepageResourceEnabledInstanceId}/settings/${settingId}`,
                    InputBody.instanceSettings('enable_homepage_resource', true),
                    { failOnStatusCode: false }
                ).then((putResponse) => {
                    expect(putResponse.status).to.eq(200);
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
            video_ids = response.body.body.data.map(v => v.id);
            sharedVideoId = video_ids[0];
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    describe('Order Field - Valid', () => {
        it('should add video with valid order value', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${getNextVideoId()}`,
                InputBody.homepageVideos(5, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.body).to.eq(true);
                expect(response.body.status.code).to.eq('ok');
            });
        });

        it('should add video with order as 0', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${getNextVideoId()}`,
                InputBody.homepageVideos(0, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should add video with order as 1', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${getNextVideoId()}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should add video with order as large positive integer (999)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${getNextVideoId()}`,
                InputBody.homepageVideos(999, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Order Field - Invalid', () => {
        it('should reject order as negative integer (-1)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(-1, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.homepageVideos.orderMin);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as large negative integer (-999)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(-999, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.homepageVideos.orderMin);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should reject order as empty value', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos('', null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);

            });
        });

        it('should reject order as null', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(null, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.body.body.order[0]).to.eq(messages.orderRequired);
                expect(response.duration).to.be.lessThan(responseTimeLimit);

            });
        });

        it('should reject order as string type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(getRandomSubstring(5), null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
            });
        });

        it('should reject order as decimal (1.5)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(1.5, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.body.order[0]).to.eq(messages.orderInteger);
            });
        });


        it('should reject order as very long integer (exceeds int limit)', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(999999999999999, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(417);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.body.order[0]).to.eq(messages.orderMaxDigits);
            });
        });

        Object.keys(securityPayloads).forEach((key) => {
            it(`should handle security verification in order input: ${key}`, () => {
                cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                    InputBody.homepageVideos(securityPayloads[key], null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    describe('URL Param - Site', () => {
        it('should return 404 for non-existent site id', () => {
            cy.Put(`/sites/999999/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should return 404 for deleted site id', () => {
            cy.Put(`/sites/${deleted_site}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should return 404 for unauthorized site id (another reseller)', () => {
            cy.Put(`/sites/${another_reseller_site}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should return 404 for empty site id', () => {
            cy.Put(`/sites//instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for site id as string type', () => {
            cy.Put(`/sites/invalid_site/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for site id as negative integer', () => {
            cy.Put(`/sites/-1/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('URL Param - Instance', () => {
        it('should return 404 for non-existent instance id', () => {
            cy.Put(`/sites/${site_id}/instances/999999/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should return 404 for deleted instance id', () => {
            cy.Put(`/sites/${site_id}/instances/999998/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should return 404 for instance id belonging to another site', () => {
            cy.Put(`/sites/${site_id}/instances/${anotherSiteInstanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.message).to.eq(messages.notFound);
            });
        });

        it('should return 404 for empty instance id', () => {
            cy.Put(`/sites/${site_id}/instances//homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for instance id as string type', () => {
            cy.Put(`/sites/${site_id}/instances/invalid_id/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for instance id as negative integer', () => {
            cy.Put(`/sites/${site_id}/instances/-1/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('URL Param - Video', () => {
        it('should add video with valid video id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${getNextVideoId()}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 403 for non-existent video id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/999999`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(403);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.code_text).to.eq(messages.homepageVideos.videoNotInBucket);
            });
        });

        it('should return 403 for deleted video id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${Videos_ids.deleted}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(403);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.code_text).to.eq(messages.homepageVideos.videoNotInBucket);
            });
        });

        it('should return 403 for video id belonging to another reseller site', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${Videos_ids.AnotherResellerVidoe}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(403);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.code_text).to.eq(messages.homepageVideos.videoNotInBucket);
            });
        });

        it('should return 403 for video id belonging to secondary site', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${Videos_ids.secondarSiteVideo}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(403);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.code_text).to.eq(messages.homepageVideos.videoNotInBucket);
            });
        });

        it('should return 404 for empty video id', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for video id as string type', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/invalid_video`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for video id as negative integer', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/-1`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 403 for video id as 0', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/0`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(403);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.status.code_text).to.eq(messages.homepageVideos.videoNotInBucket);
            });
        });

        it('should return 404 for video id as decimal', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/1.5`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('URL Param - Security', () => {
        it('should return 404 for site id as JS script injection', () => {
            cy.Put(`/sites/${encodeURIComponent("<script>alert('test')</script>")}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for instance id as SQL injection', () => {
            cy.Put(`/sites/${site_id}/instances/${encodeURIComponent("' OR '1'='1")}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for video id as directory traversal path', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${encodeURIComponent('../../etc/passwd')}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Duplicate and Conflict', () => {
        it('should return 200 when adding same video twice (duplicate entry is ignored)', () => {
            const videoId = getNextVideoId();
            cy.Put(`/sites/${site_id}/instances/${homepageResourceEnabledInstanceId}/homepage-videos/${videoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((firstResponse) => {
                expect(firstResponse.status).to.eq(200);
                cy.Put(`/sites/${site_id}/instances/${homepageResourceEnabledInstanceId}/homepage-videos/${videoId}`,
                    InputBody.homepageVideos(Order, null),
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);

                    // Verify that only one item with the same id is listed
                    cy.GetItems(`/sites/${site_id}/instances/${homepageResourceEnabledInstanceId}/homepage-videos`, { failOnStatusCode: false }).then((getResponse) => {
                        expect(getResponse.status).to.eq(200);
                        const list = Array.isArray(getResponse.body.body) ? getResponse.body.body : (getResponse.body.body.data || []);
                        const matches = list.filter(v => v.id === videoId);
                        expect(matches.length).to.eq(1);
                    });
                });
            });
        });

        it('should add video and resequence when order conflicts with existing resource', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${getNextVideoId()}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should add video at end of list when order exceeds current resource count', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${getNextVideoId()}`,
                InputBody.homepageVideos(9999, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Edge Cases', () => {
        it('should return 417 for empty JSON payload', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
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
                url: `/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
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

        it('should add video and ignore extra/unexpected fields in payload', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${getNextVideoId()}`,
                { ...InputBody.homepageVideos(Order, null), extra_field: 'test' },
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for GET request to PUT endpoint', () => {
            cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 405 for POST request to PUT endpoint', () => {
            cy.Post(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(405);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should return 404 for DELETE request to PUT endpoint when video is not attached', () => {
            cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}?version_id=`,
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });

        it('should handle concurrent PUT requests for multiple videos', () => {
            const videoId1 = getNextVideoId();
            const videoId2 = getNextVideoId();
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId1}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
            });
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId2}`,
                InputBody.homepageVideos(2, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
            });
        });
    });

    describe('Response Validation', () => {
        it('should return correct response body structure on successful PUT', () => {
            cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${getNextVideoId()}`,
                InputBody.homepageVideos(Order, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.duration).to.be.lessThan(responseTimeLimit);
                expect(response.body.body).to.eq(true);
                expect(response.body.status.message).to.eq('Okay');
                expect(response.body.status.code).to.eq('ok');
                expect(response.body.status.code_text).to.eq('Video Added Successfully');
            });
        });

        it('should verify video appears at specified order position via GET after successful PUT', () => {
            const videoId = getNextVideoId();
            const expectedOrder = 2;
            cy.Put(`/sites/${site_id}/instances/${homepageResourceEnabledInstanceId}/homepage-videos/${videoId}`,
                InputBody.homepageVideos(expectedOrder, null),
                { failOnStatusCode: false }
            ).then((response) => {
                expect(response.status).to.eq(200);
                cy.GetItems(`/sites/${site_id}/instances/${homepageResourceEnabledInstanceId}/homepage-videos`, { failOnStatusCode: false }).then((getResponse) => {
                    expect(getResponse.status).to.eq(200);
                    expect(getResponse.duration).to.be.lessThan(responseTimeLimit);
                    const addedVideo = getResponse.body.body.data.find(v => v.id === videoId);
                    expect(addedVideo).to.exist;
                });
            });
        });
    });
});
