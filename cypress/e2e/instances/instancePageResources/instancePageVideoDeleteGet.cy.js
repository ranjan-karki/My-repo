import { InputBody } from "../../../support/inputBody";
import { messages } from "../../../support/messages";
import { randomAlphaNumeric, getRandomSubstring } from "../../../utils/basicUtils";
import { securityPayloads } from "../../../utils/securityPayloads";
import { SITES, THEMES, TIMEOUTS, Videos_ids } from "../../../support/testConfig";

describe('Delete, Get and Order Instance Page Video Tests', () => {
    const { main: site_id, deleted: deleted_site, resellerSite: another_reseller_site } = SITES;
    const { deleted: deletedVideoId, unpublished: unpublishedVideoId, secondarSiteVideo: secondarySiteVideoId, AnotherResellerVidoe: anotherResellerVideoId } = Videos_ids;
    const responseTimeLimit = TIMEOUTS.response;
    const validLayout = THEMES.theme1;
    const primaryColor = '#123456';
    const secondaryColor = '#654321';
    const displayLogoTrue = true;
    const Order = 1;

    let instanceId;
    let pageId;
    let anotherInstancePageId;
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
            videos = response.body.body.data.map(v => ({ id: v.id, version_id: v.version_id ?? null }));
            sharedVideoId = videos[0].id;
            sharedVideoVersionId = videos[0].version_id;
        });
    });

    beforeEach(() => {
        cy.loginAndGetToken();
    });

    // ─── DELETE ───────────────────────────────────────────────────────────────

    describe('DELETE - Detach Video from Page', () => {
        describe('Positive Scenarios', () => {
            it('should detach video with version_id as null successfully', () => {
                const { id: videoId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}`,
                    InputBody.homepageVideos(Order, null),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}?version_id=`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });

            it('should detach video with valid version_id successfully', () => {
                const { id: videoId, version_id: versionId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}`,
                    InputBody.homepageVideos(Order, versionId),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}?version_id=${versionId ?? ''}`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });

            it('should confirm video is no longer in list after detach', () => {
                const { id: videoId, version_id: versionId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}`,
                    InputBody.homepageVideos(Order, versionId),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}?version_id=${versionId ?? ''}`,
                        { failOnStatusCode: false }
                    ).then((deleteResponse) => {
                        expect(deleteResponse.status).to.eq(200);
                        cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos`,
                            { failOnStatusCode: false }
                        ).then((listResponse) => {
                            expect(listResponse.status).to.eq(200);
                            const list = Array.isArray(listResponse.body.body) ? listResponse.body.body : (listResponse.body.body.data || []);
                            expect(list.find(v => v.id === videoId)).to.not.exist;
                            expect(listResponse.duration).to.be.lessThan(responseTimeLimit);
                        });
                    });
                });
            });

            it('should return 404 when trying to detach an already-detached video', () => {
                const { id: videoId, version_id: versionId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}`,
                    InputBody.homepageVideos(Order, versionId),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}?version_id=${versionId ?? ''}`,
                        { failOnStatusCode: false }
                    ).then((firstDelete) => {
                        expect(firstDelete.status).to.eq(200);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}?version_id=${versionId ?? ''}`,
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
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(417);
                    cy.expect(response.body.body.version_id[0]).to.eq(messages.homepageVideos.versionIdPresent);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 when version_id mismatches the attached version', () => {
                const { id: videoId, version_id: versionId } = getNextVideo();
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}`,
                    InputBody.homepageVideos(Order, null),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}?version_id=999999`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(404);
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                        cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}?version_id=`,
                            { failOnStatusCode: false }
                        );
                    });
                });
            });

            it('should return 404 for version_id as negative integer', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}?version_id=-1`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 417 for version_id as non-numeric string', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}?version_id=invalid`,
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
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/999999?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(403);
                    cy.expect(response.body.status.code_text).to.eq(messages.homepageVideos.videoNotInBucket);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for video_id as negative integer', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/-1?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for video_id as non-numeric string', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/invalid_id?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for video not attached to this page', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}?version_id=${sharedVideoVersionId ?? ''}`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for deleted video_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${deletedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for unpublished video_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${unpublishedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for video_id belonging to a secondary site', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${secondarySiteVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for video_id belonging to another reseller', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${anotherResellerVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            Object.keys(securityPayloads).forEach((key) => {
                it(`should return 404 for video_id as security payload - ${key}`, () => {
                    cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${encodeURIComponent(securityPayloads[key])}?version_id=`,
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
                cy.Delete(`/sites/999999/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for deleted site_id', () => {
                cy.Delete(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.Delete(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/videos/${sharedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.Delete(`/sites/${site_id}/instances/999999/pages/${pageId}/videos/${sharedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-numeric instance_id', () => {
                cy.Delete(`/sites/${site_id}/instances/invalid_instance/pages/${pageId}/videos/${sharedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/999999/videos/${sharedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/videos/${sharedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-numeric page_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/invalid_page/videos/${sharedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for negative page_id', () => {
                cy.Delete(`/sites/${site_id}/instances/${instanceId}/pages/-1/videos/${sharedVideoId}?version_id=`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

    // ─── GET List ─────────────────────────────────────────────────────────────

    describe('GET - List Page Videos', () => {
        describe('Positive Scenarios', () => {
            it('should return 200 and a list for valid page', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return an array in the response body', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos`,
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
                cy.Put(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos/${videoId}`,
                    InputBody.homepageVideos(Order, versionId),
                    { failOnStatusCode: false }
                ).then((addResponse) => {
                    expect(addResponse.status).to.eq(200);
                    cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos`,
                        { failOnStatusCode: false }
                    ).then((response) => {
                        expect(response.status).to.eq(200);
                        const list = Array.isArray(response.body.body) ? response.body.body : (response.body.body.data || []);
                        expect(list.find(v => v.id === videoId)).to.exist;
                        expect(response.duration).to.be.lessThan(responseTimeLimit);
                    });
                });
            });

            it('should return response with valid status object', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${pageId}/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.status).to.have.property('code');
                    expect(response.body.status).to.have.property('message');
                    expect(response.body.status.code).to.eq('ok');
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });

        // ─── URL Path Verifications ────────────────────────────────────────────

        describe('URL Path Verifications', () => {
            it('should return 404 for non-existent site_id', () => {
                cy.GetItems(`/sites/999999/instances/${instanceId}/pages/${pageId}/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for deleted site_id', () => {
                cy.GetItems(`/sites/${deleted_site}/instances/${instanceId}/pages/${pageId}/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for another reseller site_id', () => {
                cy.GetItems(`/sites/${another_reseller_site}/instances/${instanceId}/pages/${pageId}/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/999999/pages/${pageId}/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-numeric instance_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/invalid_instance/pages/${pageId}/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-existent page_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/999999/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    cy.expect(response.body.status.message).to.eq(messages.notFound);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for page_id belonging to another instance', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/${anotherInstancePageId}/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for non-numeric page_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/invalid_page/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });

            it('should return 404 for negative page_id', () => {
                cy.GetItems(`/sites/${site_id}/instances/${instanceId}/pages/-1/videos`,
                    { failOnStatusCode: false }
                ).then((response) => {
                    expect(response.status).to.eq(404);
                    expect(response.duration).to.be.lessThan(responseTimeLimit);
                });
            });
        });
    });

});