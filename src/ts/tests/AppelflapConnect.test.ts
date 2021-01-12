
import test from "ava";
import fetchMock from "fetch-mock";
import { Response } from "node-fetch";

import { buildFakeNavigator } from "./fakeNavigator";

import { AppelflapConnect } from "ts/AppelflapConnect";
import {
    TPublication,
    TPublicationTarget,
    TSubscription,
    TSubscriptions,
} from "ts/Types/CacheTypes";
/* eslint-disable prettier/prettier */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: For when the unit tests cannot find the declaration file
import { AF_LOCALHOSTURI, AF_META_API, AF_CACHE_API, AF_ACTION_API, AF_INS_LOCK, AF_PUBLICATIONS, AF_SUBSCRIPTIONS, AF_STATUS, AF_REBOOT, AppelflapPortNo } from "js/RoutingAppelflap";
// The above import statement MUST all appear on the one line for the @ts-ignore to work
/* eslint-enable prettier/prettier */

test.before((t: any) => {
    t.context["testPort"] = 9090;
    global["navigator"] = buildFakeNavigator(t.context.testPort);
    t.context["afc"] = new AppelflapConnect();
});

test.beforeEach((t: any) => {
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

test("getPortNo (Appelflap test)", (t: any) => {
    // const afc = t.context.afc as AppelflapConnect;

    t.plan(1);

    t.is(
        AppelflapPortNo(),
        t.context.testPort,
        "navigator has encoded portNo - implies Appelflap"
    );

    // global["navigator"] = buildFakeNavigator();
    // const nfc = new AppelflapConnect();
    // t.is(
    //     nfc.portNo,
    //     -1,
    //     "navigator does not have encoded portNo - implies no Appelflap"
    // );
});

/** meta status is not expected to be used by the Canoe-Appelflap cache API */
test("getMetaStatus", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_META_API}/${AF_STATUS}`;

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

    const result = await afc.getMetaStatus();
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

test("Cache: status", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_STATUS}`;
    const testResponse = {
        "staged-caches": {
            "some-web-origin": { "some-cache-name": { Size: 9000 } },
        },
        "disk-free": 9000,
    };
    const successResponse = new Response(JSON.stringify(testResponse), {
        status: 200,
        statusText: "Ok",
        headers: { "Content-Type": "application/json" },
    });

    fetchMock.get(testUri, successResponse);
    const successResult = await afc.getCacheStatus();
    t.deepEqual(successResult, testResponse);

    fetchMock.get(testUri, authFailureResponse, { overwriteRoutes: true });
    const result = await t.throwsAsync(afc.getCacheStatus());
    t.is(result.message, authFailureResponse.statusText);

    fetchMock.reset();
});

test("Cache: canoe reboot", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_ACTION_API}/${AF_REBOOT}`;

    fetchMock.post(testUri, successResponse);
    const successResult = await afc.doReboot();
    t.is(successResult, "ok");

    fetchMock.post(testUri, authFailureResponse, { overwriteRoutes: true });
    const result = await t.throwsAsync(afc.doReboot());
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

test("Cache: publish", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const badRequestResponse = t.context.badRequestResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;
    const notFoundResponse = t.context.notFoundResponse as Response;
    const conflictResponse = t.context.conflictResponse as Response;
    const serviceUnavailableResponse = t.context
        .serviceUnavailableResponse as Response;

    const webOrigin = "some-web-origin";
    const cacheName = "some-cache-name";
    const version = 10;
    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_PUBLICATIONS}/${webOrigin}/${cacheName}`;
    const publication: TPublication = {
        webOrigin: webOrigin,
        cacheName: cacheName,
        version: version,
    };

    // When doing throwsAsync tests, expect 2 assertions returned for each test
    // And do the 'ok' test last to ensure that all tests are awaited
    t.plan(11);
    [
        badRequestResponse,
        authFailureResponse,
        notFoundResponse,
        conflictResponse,
        serviceUnavailableResponse,
    ].forEach(async (response) => {
        fetchMock.put(testUri, response, { overwriteRoutes: true });
        const failureResult = await t.throwsAsync(afc.publish(publication));
        t.is(failureResult.message, response.statusText);
    });

    fetchMock.put(testUri, successResponse, { overwriteRoutes: true });
    const successResult = await afc.publish(publication);
    t.is(successResult, "ok");

    fetchMock.reset();
});

test("Cache: unpublish", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;
    const notFoundResponse = t.context.notFoundResponse as Response;
    const conflictResponse = t.context.conflictResponse as Response;

    const webOrigin = "some-web-origin";
    const cacheName = "some-cache-name";
    const version = 10;
    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_PUBLICATIONS}/${webOrigin}/${cacheName}`;
    const publication: TPublication = {
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
    const testResponse = {
        "some-web-origin": {
            "some-cache-name": { versionMin: 10, versionMax: 9000 },
        },
    };

    const successResponse = new Response(JSON.stringify(testResponse), {
        status: 200,
        statusText: "Ok",
        headers: { "Content-Type": "application/json" },
    });

    fetchMock.get(testUri, successResponse);
    const successResult = await afc.getSubscriptions();
    t.deepEqual(successResult, testResponse);

    fetchMock.get(testUri, authFailureResponse, { overwriteRoutes: true });
    const result = await t.throwsAsync(afc.getSubscriptions());
    t.is(result.message, authFailureResponse.statusText);

    fetchMock.reset();
});

test("Cache: subscribe", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;
    const conflictResponse = t.context.conflictResponse as Response;

    const webOrigin = "some-web-origin";
    const cacheName = "some-cache-name";
    const versionMin = 10;
    const versionMax = 9000;
    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_SUBSCRIPTIONS}/${webOrigin}/${cacheName}`;
    const subscription: TSubscription = {
        webOrigin: webOrigin,
        cacheName: cacheName,
        versionMin: versionMin,
        versionMax: versionMax,
    };
    const badSubscription: TSubscription = {
        webOrigin: webOrigin,
        cacheName: cacheName,
        versionMin: versionMax,
        versionMax: versionMin,
    };

    // When doing throwsAsync tests, expect 2 assertions returned for each test
    // And do the 'ok' test last to ensure that all tests are awaited
    t.plan(7);
    [authFailureResponse, conflictResponse].forEach(async (response) => {
        fetchMock.put(testUri, response, { overwriteRoutes: true });
        const failureResult = await t.throwsAsync(afc.subscribe(subscription));
        t.is(failureResult.message, response.statusText);
    });

    fetchMock.put(testUri, successResponse, { overwriteRoutes: true });
    const failureResult = await t.throwsAsync(afc.subscribe(badSubscription));
    t.is(
        failureResult.message,
        "versionMin must be less than or equal to versionMax"
    );

    fetchMock.put(testUri, successResponse, { overwriteRoutes: true });
    const successResult = await afc.subscribe(subscription);
    t.is(successResult, "ok");

    fetchMock.reset();
});

test("Cache: unsubscribe", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;
    const notFoundResponse = t.context.notFoundResponse as Response;
    const conflictResponse = t.context.conflictResponse as Response;

    const webOrigin = "some-web-origin";
    const cacheName = "some-cache-name";
    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_SUBSCRIPTIONS}/${webOrigin}/${cacheName}`;
    const subscription: TPublicationTarget = {
        webOrigin: webOrigin,
        cacheName: cacheName,
    };

    // When doing throwsAsync tests, expect 2 assertions returned for each test
    // And do the 'ok' test last to ensure that all tests are awaited
    t.plan(7);
    [authFailureResponse, notFoundResponse, conflictResponse].forEach(
        async (response) => {
            fetchMock.delete(testUri, response, { overwriteRoutes: true });
            const failureResult = await t.throwsAsync(
                afc.unsubscribe(subscription)
            );
            t.is(failureResult.message, response.statusText);
        }
    );

    fetchMock.delete(testUri, successResponse, { overwriteRoutes: true });
    const successResult = await afc.unsubscribe(subscription);
    t.is(successResult, "ok");

    fetchMock.reset();
});

test("Cache: bulkSubscribe", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const badRequestResponse = t.context.badRequestResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${AF_LOCALHOSTURI}:${t.context.testPort}/${AF_CACHE_API}/${AF_SUBSCRIPTIONS}`;
    const subscriptions: TSubscriptions = {
        "some-web-origin": {
            "some-cache-name": {
                versionMin: 10,
                versionMax: 9000,
            },
            "some-other-cache-name": {
                versionMin: 10,
                versionMax: 9000,
            },
        },
        "some-other-web-origin": {
            "yet-another-cache-name": {
                versionMin: 10,
                versionMax: 9000,
            },
        },
    };

    // When doing throwsAsync tests, expect 2 assertions returned for each test
    // And do the 'ok' test last to ensure that all tests are awaited
    t.plan(5);
    [badRequestResponse, authFailureResponse].forEach(async (response) => {
        fetchMock.post(testUri, response, { overwriteRoutes: true });
        const failureResult = await t.throwsAsync(
            afc.bulkSubscribe(subscriptions)
        );
        t.is(failureResult.message, response.statusText);
    });

    fetchMock.post(testUri, successResponse, { overwriteRoutes: true });
    const successResult = await afc.bulkSubscribe(subscriptions);
    t.is(successResult, "ok");

    fetchMock.reset();
});
