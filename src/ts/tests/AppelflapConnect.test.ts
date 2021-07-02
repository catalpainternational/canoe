import test from "ava";
import fetchMock from "fetch-mock";
import { Response } from "node-fetch";

global.atob = require("atob");
global.btoa = require("btoa");

import { buildFakeNavigator } from "./fakeNavigator";

import { AppelflapConnect } from "../Appelflap/AppelflapConnect";
import {
    TCertificate,
    TPublication,
    TSubscriptions,
} from "../Types/CacheTypes";

/* eslint-disable prettier/prettier */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: For when the unit tests cannot find the declaration file
import { AF_LOCALHOSTURI, AF_ENDPOINT, AF_SERVER_PROPERTIES, AF_PEER_PROPERTIES, AF_EIKEL_META_API, AF_CACHE_API, AF_ACTION_API, AF_INS_LOCK, AF_PUBLICATIONS, AF_SUBSCRIPTIONS, AF_STATUS, AF_REBOOT_SOFT, AF_CERTCHAIN, AF_CERTCHAIN_LENGTH_HEADER } from "ts/Appelflap/AppelflapRouting";
// The above import statement MUST all appear on the one line for the @ts-ignore to work
/* eslint-enable prettier/prettier */

test.before((t: any) => {
    // The testPort needs to be the same value as defined for the 'mock' in AppelflapConnect
    t.context["testPort"] = 9090;
    global["navigator"] = buildFakeNavigator(t.context.testPort);
    const gt = globalThis as Record<string, any>;
    gt["AFC_MOCKMODE"] = true;
    t.context["afc"] = AppelflapConnect.getInstance();

    const endpointProps = {
        user: "a",
        password: "b",
        port: t.context["testPort"],
    };
    fetchMock.mock(`${AF_ENDPOINT}/${AF_SERVER_PROPERTIES}`, endpointProps);
});

test.beforeEach(async (t: any) => {
    t.context["successResponse"] = new Response("ok", {
        status: 200,
        statusText: "Ok",
    });

    t.context["authFailureResponse"] = new Response(undefined, {
        status: 401,
        statusText: "Not Authorized",
    });

    // When the version supplied is invalid
    t.context["badRequestResponse"] = new Response(undefined, {
        status: 400,
        statusText: "Bad Request",
    });

    // when Appelflap can't find the designated cache
    t.context["notFoundResponse"] = new Response(undefined, {
        status: 404,
        statusText: "Not Found",
    });

    // when a packing action is already in progress for this cache
    t.context["conflictResponse"] = new Response(undefined, {
        status: 409,
        statusText: "Conflict",
    });

    // when Appelflap is too busy to comply (perhaps it's packing up some other cache)
    t.context["serviceUnavailableResponse"] = new Response(undefined, {
        status: 503,
        statusText: "Service Unavailable",
    });
});

/** eikel meta status (index of stored large objects) is not expected to be used by the Canoe-Appelflap cache API */
test("getLargeObjectIndexStatus", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_EIKEL_META_API}/${AF_STATUS}`;

    const state = {
        diskused: 554058,
        diskfree: 69899911168,
        disksize: 429494632448,
        eikels: [
            {
                path: "what/ever/path/I/want/flower.webm",
                headers: {
                    "Favourite-Condiment": "peanutbutter",
                    "Content-Type": "video/webm",
                },
                size: 554058,
                lastmodified: 1583245457,
            },
        ],
    };
    fetchMock.get(testUri, state);

    const result = await afc.getLargeObjectIndexStatus();
    fetchMock.reset();
    t.deepEqual(result, state);
});

test("Cache: lock", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_INS_LOCK}`;

    fetchMock.put(testUri, successResponse);
    const successResult = await afc.lock();
    t.is(successResult, "ok");

    fetchMock.put(testUri, authFailureResponse, { overwriteRoutes: true });
    const result = await t.throwsAsync(afc.lock());
    t.is(result.message, authFailureResponse.statusText);

    fetchMock.reset();
});

test("Cache: unlock", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_INS_LOCK}`;

    fetchMock.delete(testUri, successResponse);
    const successResult = await afc.unlock();
    t.is(successResult, "ok");

    fetchMock.delete(testUri, authFailureResponse, { overwriteRoutes: true });
    const result = await t.throwsAsync(afc.unlock());
    t.is(result.message, authFailureResponse.statusText);

    fetchMock.reset();
});

test("Cache: canoe reboot soft", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_ACTION_API}/${AF_REBOOT_SOFT}`;

    fetchMock.post(testUri, successResponse);
    const successResult = await afc.doRebootSoft();
    t.is(successResult, "ok");

    fetchMock.post(testUri, authFailureResponse, { overwriteRoutes: true });
    const result = await t.throwsAsync(afc.doRebootSoft());
    t.is(result.message, authFailureResponse.statusText);

    fetchMock.reset();
});

test("Cache: getPublications", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_PUBLICATIONS}`;
    const testResponse = {
        "some-web-origin": {
            "some-cache-name": { Version: 10, Size: 9000 },
        },
    };

    const successResponse = new Response(JSON.stringify(testResponse), {
        status: 200,
        statusText: "Ok",
        headers: { "Content-Type": "application/json" },
    });

    fetchMock.get(testUri, successResponse);
    const successResult = await afc.getPublications();
    t.deepEqual(successResult, testResponse);

    fetchMock.get(testUri, authFailureResponse, { overwriteRoutes: true });
    const result = await t.throwsAsync(afc.getPublications());
    t.is(result.message, authFailureResponse.statusText);

    fetchMock.reset();
});

test.skip("Cache: publish", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const badRequestResponse = t.context.badRequestResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;
    const notFoundResponse = t.context.notFoundResponse as Response;
    const conflictResponse = t.context.conflictResponse as Response;
    const serviceUnavailableResponse = t.context
        .serviceUnavailableResponse as Response;

    const bundleType = "CACHE";
    const webOrigin = "some-web-origin";
    const cacheName = "some-cache-name";
    const version = 10;
    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_PUBLICATIONS}/${bundleType}/${webOrigin}/${cacheName}/${version}`;
    const publication: TPublication = {
        bundleType: bundleType,
        webOrigin: webOrigin,
        cacheName: cacheName,
        version: version,
    };

    // When doing throwsAsync tests, expect 2 assertions returned for each test
    // And do the 'ok' test last to ensure that all tests are awaited
    let isFirst = true;
    t.plan(11);
    [
        badRequestResponse,
        authFailureResponse,
        notFoundResponse,
        conflictResponse,
        serviceUnavailableResponse,
    ].forEach(async (response) => {
        fetchMock.put(testUri, response, { overwriteRoutes: true });
        if (isFirst) {
            await t.notThrowsAsync(afc.publish(publication));
            isFirst = false;
        } else {
            const failureResult = await t.throwsAsync(afc.publish(publication));
            t.is(failureResult.message, response.statusText);
        }
    });

    fetchMock.put(testUri, successResponse, { overwriteRoutes: true });
    const successResult = await afc.publish(publication);
    t.is(successResult, "ok");

    fetchMock.reset();
});

test.skip("Cache: unpublish", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;
    const notFoundResponse = t.context.notFoundResponse as Response;
    const conflictResponse = t.context.conflictResponse as Response;

    const bundleType = "CACHE";
    const webOrigin = "some-web-origin";
    const cacheName = "some-cache-name";
    const version = 10;
    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_PUBLICATIONS}/${bundleType}/${webOrigin}/${cacheName}/${version}`;
    const publication: TPublication = {
        bundleType: bundleType,
        webOrigin: webOrigin,
        cacheName: cacheName,
        version: version,
    };

    // When doing throwsAsync tests, expect 2 assertions returned for each test
    // And do the 'ok' test last to ensure that all tests are awaited
    t.plan(7);
    [authFailureResponse, notFoundResponse, conflictResponse].forEach(
        async (response) => {
            fetchMock.delete(testUri, response, { overwriteRoutes: true });
            const failureResult = await t.throwsAsync(
                afc.unpublish(publication)
            );
            t.is(failureResult.message, response.statusText);
        }
    );

    fetchMock.delete(testUri, successResponse, { overwriteRoutes: true });
    const successResult = await afc.unpublish(publication);
    t.is(successResult, "ok");

    fetchMock.reset();
});

test("Cache: getSubscriptions", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`;
    const testEmptyResponse: TSubscriptions = { types: {} };
    const testResponse: TSubscriptions = {
        types: {
            CACHE: {
                groups: {
                    "some-web-origin": {
                        names: {
                            "some-cache-name": {
                                injection_version_min: 10,
                                injection_version_max: 20,
                                p2p_version_min: 200,
                                p2p_version_max: 888,
                                injected_version: 12,
                            },
                            "another-cache-name": {
                                injection_version_min: 42,
                                injection_version_max: 42,
                                p2p_version_min: 1,
                                p2p_version_max: 9000,
                                injected_version: null,
                            },
                        },
                    },
                    "some-other-web-origin": {
                        names: {
                            "yet-another-cache-name": {
                                injection_version_min: 42,
                                injection_version_max: 42,
                                p2p_version_min: 1,
                                p2p_version_max: 9000,
                                injected_version: null,
                            },
                        },
                    },
                },
            },
            SWORK: {
                groups: {
                    "https://learn.canoe-engineering.temp.build": {
                        names: {
                            "sw.js": {
                                injection_version_min: 2,
                                injection_version_max: 2,
                                p2p_version_min: 1,
                                p2p_version_max: 9000,
                                injected_version: 2,
                            },
                        },
                    },
                },
            },
        },
    };

    const successEmptyResponse = new Response(
        JSON.stringify(testEmptyResponse),
        {
            status: 200,
            statusText: "Ok",
            headers: { "Content-Type": "application/json" },
        }
    );

    const successResponse = new Response(JSON.stringify(testResponse), {
        status: 200,
        statusText: "Ok",
        headers: { "Content-Type": "application/json" },
    });

    // Do failure tests before success tests
    fetchMock.get(testUri, authFailureResponse, { overwriteRoutes: true });
    const result = await t.throwsAsync(afc.getSubscriptions());
    t.is(result.message, authFailureResponse.statusText);

    fetchMock.get(testUri, successEmptyResponse);
    const successEmptyResult = await afc.getSubscriptions();
    t.deepEqual(successEmptyResult, testEmptyResponse);

    fetchMock.get(testUri, successResponse);
    const successResult = await afc.getSubscriptions();
    t.deepEqual(successResult, testResponse);

    fetchMock.reset();
});

// When doing throwsAsync tests, expect 2 assertions returned for each test
// And do the 'ok' test last to ensure that all tests are awaited

test.skip("Cache: setSubscriptions", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const badRequestResponse = t.context.badRequestResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`;
    const subscriptions: TSubscriptions = {
        types: {
            CACHE: {
                groups: {
                    "some-web-origin": {
                        names: {
                            "some-cache-name": {
                                injection_version_min: 10,
                                injection_version_max: 20,
                                p2p_version_min: 200,
                                p2p_version_max: 888,
                                injected_version: 12,
                            },
                            "another-cache-name": {
                                injection_version_min: 42,
                                injection_version_max: 42,
                                p2p_version_min: 1,
                                p2p_version_max: 9000,
                                injected_version: null,
                            },
                        },
                    },
                    "some-other-web-origin": {
                        names: {
                            "yet-another-cache-name": {
                                injection_version_min: 42,
                                injection_version_max: 42,
                                p2p_version_min: 1,
                                p2p_version_max: 9000,
                                injected_version: null,
                            },
                        },
                    },
                },
            },
        },
    };

    // When doing throwsAsync tests, expect 2 assertions returned for each test
    // And do the 'ok' test last to ensure that all tests are awaited
    t.plan(5);
    [badRequestResponse, authFailureResponse].forEach(async (response) => {
        fetchMock.put(testUri, response, { overwriteRoutes: true });
        const failureResult = await t.throwsAsync(
            afc.setSubscriptions(subscriptions)
        );
        t.is(failureResult.message, response.statusText);
    });

    fetchMock.put(testUri, successResponse, { overwriteRoutes: true });
    const successResult = await afc.setSubscriptions(subscriptions);
    t.is(successResult, "ok");

    fetchMock.reset();
});

test("Cache: Get Package Certificate", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_CERTCHAIN}`;

    const unsignedTestResult: TCertificate = {
        cert: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJsakNDQVgrZ0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFQTVEwd0N3WURWUVFERXdSeWNrdFlNQjRYRFRjd01ERXcKTVRBd01EQXdNRm9YRFRRNE1ERXdNVEF3TURBd01Gb3dEekVOTUFzR0ExVUVBeE1FY25KTFdEQ0NBU0l3RFFZSktvWklodmNOQVFFQgpCUUFEZ2dFUEFEQ0NBUW9DZ2dFQkFMQk1TQXNaWHk2c05uUzBoenVDb1ZTd05USDVVVEN4bk54WFZ3RkFxREZOVVFrL0dBdDZidDM3CmZMYi9TWUcwTnB5NlJHa295dDlELzhtUy9FNG5GUnV0RXU4ekhJam9mR2JqTXp3clZUNDVlUU5aNmtVSU80MGJXU3Y3UXFsZG53STIKdXU5d0lPNGF1OTdzUEhtSXZXaWRpMm1lcmFoRzFsemQ4VEI1cnRRc0JoN2JKdnJYYTNONUpDN1BLK0Y0aEplclUxWERPWFpNVFFtdAorL2dKMzhxMGFaTVl0Z2xOVTZRVjVwUkh1Y1RKTW45Q09iNTBIQ3BJbDlmdDZIazM4M3MyNWJGVmVGWlQwQVRHenlLOVhvZ0t1Z2hjClRLQzNjNXJlUlljZk9yQlRScTFsRE1yclBzQURyWjZMWUtDcmkvTG5hZ2hyeEIrNmlCK1FuRTBDMTBFQ0F3RUFBVEFOQmdrcWhraUcKOXcwQkFRc0ZBQU1DQUFBPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t",
        isCertSigned: false,
    };
    const unsignedCertResponse = new Response(unsignedTestResult.cert, {
        status: 200,
        statusText: "Ok",
    });
    unsignedCertResponse.headers.append(
        AF_CERTCHAIN_LENGTH_HEADER,
        unsignedTestResult.isCertSigned ? "3" : "1"
    );

    const signedTestResult: TCertificate = {
        cert: "Some Signed PEM cert",
        isCertSigned: true,
    };
    const signedCertResponse = new Response(signedTestResult.cert, {
        status: 200,
        statusText: "Ok",
    });
    signedCertResponse.headers.append(
        AF_CERTCHAIN_LENGTH_HEADER,
        signedTestResult.isCertSigned ? "3" : "1"
    );

    fetchMock.get(testUri, unsignedCertResponse);
    const unsignedSuccessResult = await afc.getCertificate();
    t.is(unsignedSuccessResult.isCertSigned, unsignedTestResult.isCertSigned);
    t.is(unsignedSuccessResult.cert, unsignedTestResult.cert);

    fetchMock.get(testUri, signedCertResponse);
    const signedSuccessResult = await afc.getCertificate();
    t.is(signedSuccessResult.isCertSigned, signedTestResult.isCertSigned);
    t.is(signedSuccessResult.cert, signedTestResult.cert);

    fetchMock.reset();
});

test.skip("Cache: Save Package Certificate", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const badRequestResponse = t.context.badRequestResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_CERTCHAIN}`;

    const signedTestCertificate: TCertificate = {
        cert: "Some Signed PEM cert",
        isCertSigned: true,
    };

    // When doing throwsAsync tests, expect 2 assertions returned for each test
    // And do the 'ok' test last to ensure that all tests are awaited
    t.plan(5);
    [badRequestResponse, authFailureResponse].forEach(async (response) => {
        fetchMock.put(testUri, response, { overwriteRoutes: true });
        const failureResult = await t.throwsAsync(
            afc.saveCertificate(signedTestCertificate)
        );
        t.is(failureResult.message, response.statusText);
    });

    fetchMock.put(testUri, successResponse, { overwriteRoutes: true });
    const successResult = await afc.saveCertificate(signedTestCertificate);
    t.is(successResult, "ok");

    fetchMock.reset();
});

test.skip("Cache: Delete Package Certificate", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_CERTCHAIN}`;

    // When doing throwsAsync tests, expect 2 assertions returned for each test
    // And do the 'ok' test last to ensure that all tests are awaited
    t.plan(3);
    [authFailureResponse].forEach(async (response) => {
        fetchMock.delete(testUri, response, { overwriteRoutes: true });
        const failureResult = await t.throwsAsync(afc.deleteCertificate());
        t.is(failureResult.message, response.statusText);
    });

    fetchMock.delete(testUri, successResponse, { overwriteRoutes: true });
    const successResult = await afc.deleteCertificate();
    t.is(successResult, "ok");

    fetchMock.reset();
});

test("Appelflap: peer ID", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;

    const testUri = `${AF_ENDPOINT}/${AF_PEER_PROPERTIES}`;
    const testResponse = {
        "ID": 3657874,
        "friendly_ID": "qZdP",
        "palette": "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"
    };
    const successResponse = new Response(JSON.stringify(testResponse), {
        status: 200,
        statusText: "Ok",
        headers: { "Content-Type": "application/json" },
    });

    fetchMock.get(testUri, successResponse);
    const successResult = await afc.getPeerProperties();
    t.deepEqual(successResult, testResponse);

    fetchMock.reset();
});
