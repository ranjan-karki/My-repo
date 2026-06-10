import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS } from "../../../support/testConfig";

describe('Delete and List Homepage Video Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;

    const displayLogoTrue = true;
    const primaryColor = '#123456';
    const secondaryColor = '#654321';
    const settingKeyHomepageResource = 'enable_homepage_resource';
    const Order = 1;

    let instanceId;
    let anotherSiteInstanceId;
    let videos = [];
    let sharedVideoId;
    let sharedVideoVersionId;
    let videoIndex = 0;

    const getNextVideo = () => videos[videoIndex++];

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
                    InputBody.instanceSettings(settingKeyHomepageResource, displayLogoTrue),
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
            videos = response.body.body.data.map(v => ({ id: v.id, version_id: v.version_id ?? null }));
            sharedVideoId = videos[0].id;
            sharedVideoVersionId = videos[0].version_id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // ─── DELETE ───────────────────────────────────────────────────────────────

    describe('DELETE - Detach Video from Homepage', () => {

        describe('Positive Scenarios', () => {
            it('should detach video with version_id as null successfully', () => {
                const { id: videoId, version_id: versionId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}`,
                    InputBody.homepageVideos(Order, null),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}?version_id=`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });

            it('should detach video with valid version_id successfully', () => {
                const { id: videoId, version_id: versionId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}`,
                    InputBody.homepageVideos(Order, versionId),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}?version_id=${versionId ?? ''}`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });

            it('should confirm video is no longer in list after detach', () => {
                const { id: videoId, version_id: versionId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}`,
                    InputBody.homepageVideos(Order, versionId),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}?version_id=${versionId ?? ''}`,
                        { failOnStatusCode: false }
                    ).then((deleteResponse) => {
                        expect(deleteResponse.status).to.eq(200);
                        cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-videos`,
                            { failOnStatusCode: false }
                        ).then((listResponse) => {
                            expect(listResponse.status).to.eq(200);
                            const list = Array.isArray(listResponse.body.body) ? listResponse.body.body : (listResponse.body.body.data || []);
                            const found = list.find(v => v.id === videoId);
                            expect(found).to.not.exist;
                            expect(listResponse.duration).to.be.lessThan(responseTimeLimit);
                        });
                    });
                });
            });

            it('should return 404 when trying to detach an already detached video', () => {
                const { id: videoId, version_id: versionId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}`,
                    InputBody.homepageVideos(Order, versionId),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}?version_id=${versionId ?? ''}`,
                        { failOnStatusCode: false }
                    ).then((firstDelete) => {
                        expect(firstDelete.status).to.eq(200);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}?version_id=${versionId ?? ''}`,
                            { failOnStatusCode: false }
                        ).then((response) => {
                            expect(response.status).to.eq(404);
                            expect(response.duration).to.be.lessThan(responseTimeLimit);
                        });
                    });
                });
            });
        });

        // ─── Version ID Verifications ──────────────────────────────────────────

        describe('Version ID Verifications', () => {
            it('should return 417 when version_id param is missing from request', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    cy.expect(response.body.body.version_id[0]).to.eq(messages.homepageVideos.versionIdPresent);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 when version_id mismatches the attached version', () => {
                const { id: videoId, version_id: versionId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}`,
                    InputBody.homepageVideos(Order, null),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}?version_id=999999`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}?version_id=`,
                            { failOnStatusCode: false }
                        );
                    });
                });
            });

            it('should return 404 for version_id as negative integer', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}?version_id=-1`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 417 for version_id as non-numeric string', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}?version_id=invalid`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    cy.expect(response.body.body.version_id[0]).to.eq(messages.versionIdInteger);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        // ─── Video ID Verifications ────────────────────────────────────────────

        describe('Video ID Verifications', () => {
            it('should return 403 for non-existent video_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/999999?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(403);
                    cy.expect(response.body.status.code_text).to.eq(messages.homepageVideos.videoNotInBucket);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 403 for video_id as 0', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/0?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(403);
                    cy.expect(response.body.status.code_text).to.eq(messages.homepageVideos.videoNotInBucket);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for video_id as negative integer', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/-1?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for video_id as non-numeric string', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/invalid_id?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for video not attached to this instance', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for video_id as security payload - ${key}`, () => {
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${encodeURIComponent(securityPayloads[key])}?version_id=`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });
        });

        // ─── URL Path Verifications ────────────────────────────────────────────

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.Delete(`/sites/999999/instances/${instanceId}/homepage-videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for deleted site_id', () => {
                cy.Delete(`/sites/${deleted_site}/instances/${instanceId}/homepage-videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.Delete(`/sites/${another_reseller_site}/instances/${instanceId}/homepage-videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-numeric site_id', () => {
                cy.Delete(`/sites/invalid_site/instances/${instanceId}/homepage-videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for negative site_id', () => {
                cy.Delete(`/sites/-1/instances/${instanceId}/homepage-videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.Delete(`/sites/${site_id}/instances/999999/homepage-videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-numeric instance_id', () => {
                cy.Delete(`/sites/${site_id}/instances/invalid_instance/homepage-videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for negative instance_id', () => {
                cy.Delete(`/sites/${site_id}/instances/-1/homepage-videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for instance_id belonging to another site', () => {
                cy.Delete(`/sites/${site_id}/instances/${anotherSiteInstanceId}/homepage-videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── GET List ─────────────────────────────────────────────────────────────

    describe('GET - List Homepage Videos', () => {

        describe('Positive Scenarios', () => {
            it('should return 200 and a list for valid instance', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return an array in the response body', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                    expect(list).to.be.an('array');
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should confirm attached video appears in the list', () => {
                const { id: videoId, version_id: versionId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/homepage-videos/${videoId}`,
                    InputBody.homepageVideos(Order, versionId),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-videos`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                        const found = list.find(v => v.id === videoId);
                        expect(found).to.exist;
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });

            it('should return response with valid status object', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.status).to.have.property('code');
                    expect(response.body.status).to.have.property('code_text');
                    expect(response.body.status).to.have.property('message');
                    expect(response.body.status.code).to.eq('ok');
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        // ─── URL Path Verifications ────────────────────────────────────────────

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.GetItems(`/sites/999999/instances/${instanceId}/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for deleted site_id', () => {
                cy.GetItems(`/sites/${deleted_site}/instances/${instanceId}/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-numeric site_id', () => {
                cy.GetItems(`/sites/invalid_site/instances/${instanceId}/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for negative site_id', () => {
                cy.GetItems(`/sites/-1/instances/${instanceId}/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/999999/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-numeric instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/invalid_instance/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for negative instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/-1/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for instance_id belonging to another site', () => {
                cy.GetItems(`/sites/${site_id}/instances/${anotherSiteInstanceId}/homepage-videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });
});
