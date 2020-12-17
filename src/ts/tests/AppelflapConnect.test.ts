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
    const afc = t.context.afc as AppelflapConnect;
    t.is(
        afc.portNo,
        t.context.testPort,
        "navigator has encoded portNo - implies Appelflap"
    );

    global["navigator"] = buildFakeNavigator();
    const nfc = new AppelflapConnect();
    t.is(
        nfc.portNo,
        -1,
        "navigator does not have encoded portNo - implies no Appelflap"
    );
});

/** meta status is not expected to be used by the Canoe-Appelflap cache API */
test("getMetaStatus", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.metaApi}/${afc.status}`;

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

    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.insLock}`;

    fetchMock.put(testUri, successResponse);
    const successResult = await afc.lock();
    t.is(successResult, "ok");

    fetchMock.put(testUri, authFailureResponse, { overwriteRoutes: true });
    await afc.lock().catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.reset();
});

test("Cache: unlock", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.insLock}`;

    fetchMock.delete(testUri, successResponse);
    const successResult = await afc.unlock();
    t.is(successResult, "ok");

    fetchMock.delete(testUri, authFailureResponse, { overwriteRoutes: true });
    await afc.unlock().catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.reset();
});

test("Cache: status", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.status}`;
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
    await afc.getCacheStatus().catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.reset();
});

test("Cache: canoe reboot", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.actionApi}/${afc.reboot}`;

    fetchMock.post(testUri, successResponse);
    const successResult = await afc.doReboot();
    t.is(successResult, "ok");

    fetchMock.post(testUri, authFailureResponse, { overwriteRoutes: true });
    await afc.doReboot().catch((reason: any) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.reset();
});

test("Cache: getPublications", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.publications}`;
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
    await afc.getPublications().catch((reason) => {
        t.is(reason, "Not Authorized");
    });

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
    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.publications}/${webOrigin}/${cacheName}`;
    const publication: TPublication = {
        webOrigin: webOrigin,
        cacheName: cacheName,
        version: version,
    };

    fetchMock.put(testUri, successResponse);
    const successResult = await afc.publish(publication);
    t.is(successResult, "ok");

    fetchMock.put(testUri, authFailureResponse, { overwriteRoutes: true });
    await afc.publish(publication).catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.put(testUri, badRequestResponse, { overwriteRoutes: true });
    await afc.publish(publication).catch((reason) => {
        t.is(reason, "Bad Request");
    });

    fetchMock.put(testUri, notFoundResponse, { overwriteRoutes: true });
    await afc.publish(publication).catch((reason) => {
        t.is(reason, "Not Found");
    });

    fetchMock.put(testUri, conflictResponse, { overwriteRoutes: true });
    await afc.publish(publication).catch((reason) => {
        t.is(reason, "Conflict");
    });

    fetchMock.put(testUri, serviceUnavailableResponse, {
        overwriteRoutes: true,
    });
    await afc.publish(publication).catch((reason) => {
        t.is(reason, "Service Unavailable");
    });

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
    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.publications}/${webOrigin}/${cacheName}`;
    const publication: TPublication = {
        webOrigin: webOrigin,
        cacheName: cacheName,
        version: version,
    };

    fetchMock.delete(testUri, successResponse);
    const successResult = await afc.unpublish(publication);
    t.is(successResult, "ok");

    fetchMock.delete(testUri, authFailureResponse, { overwriteRoutes: true });
    await afc.unpublish(publication).catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.delete(testUri, notFoundResponse, { overwriteRoutes: true });
    await afc.unpublish(publication).catch((reason) => {
        t.is(reason, "Not Found");
    });

    fetchMock.delete(testUri, conflictResponse, { overwriteRoutes: true });
    await afc.unpublish(publication).catch((reason) => {
        t.is(reason, "Conflict");
    });

    fetchMock.reset();
});

test("Cache: getSubscriptions", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.subscriptions}`;
    const testResponse = {
        "some-web-origin": {
            "some-cache-name": { "Version-Min": 10, "Version-Max": 9000 },
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
    await afc.getSubscriptions().catch((reason) => {
        t.is(reason, "Not Authorized");
    });

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
    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.subscriptions}/${webOrigin}/${cacheName}`;
    const subscription: TSubscription = {
        webOrigin: webOrigin,
        cacheName: cacheName,
        "Version-Min": versionMin,
        "Version-Max": versionMax,
    };

    fetchMock.put(testUri, successResponse);
    const successResult = await afc.subscribe(subscription);
    t.is(successResult, "ok");

    fetchMock.put(testUri, authFailureResponse, { overwriteRoutes: true });
    await afc.subscribe(subscription).catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.put(testUri, conflictResponse, { overwriteRoutes: true });
    await afc.subscribe(subscription).catch((reason) => {
        t.is(reason, "Conflict");
    });

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
    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.subscriptions}/${webOrigin}/${cacheName}`;
    const subscription: TPublicationTarget = {
        webOrigin: webOrigin,
        cacheName: cacheName,
    };

    fetchMock.delete(testUri, successResponse);
    const successResult = await afc.unsubscribe(subscription);
    t.is(successResult, "ok");

    fetchMock.delete(testUri, authFailureResponse, { overwriteRoutes: true });
    await afc.unsubscribe(subscription).catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.delete(testUri, notFoundResponse, { overwriteRoutes: true });
    await afc.unsubscribe(subscription).catch((reason) => {
        t.is(reason, "Not Found");
    });

    fetchMock.delete(testUri, conflictResponse, { overwriteRoutes: true });
    await afc.unsubscribe(subscription).catch((reason) => {
        t.is(reason, "Conflict");
    });

    fetchMock.reset();
});

test("Cache: bulkSubscribe", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const successResponse = t.context.successResponse as Response;
    const badRequestResponse = t.context.badRequestResponse as Response;
    const authFailureResponse = t.context.authFailureResponse as Response;

    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.subscriptions}`;
    const subscriptions: TSubscriptions = {
        "some-web-origin": {
            "some-cache-name": {
                "Version-Min": 10,
                "Version-Max": 9000,
            },
            "some-other-cache-name": {
                "Version-Min": 10,
                "Version-Max": 9000,
            },
        },
        "some-other-web-origin": {
            "yet-another-cache-name": {
                "Version-Min": 10,
                "Version-Max": 9000,
            },
        },
    };

    fetchMock.post(testUri, successResponse);
    const successResult = await afc.bulkSubscribe(subscriptions);
    t.is(successResult, "ok");

    fetchMock.post(testUri, badRequestResponse, { overwriteRoutes: true });
    await afc.bulkSubscribe(subscriptions).catch((reason) => {
        t.is(reason, "Bad Request");
    });

    fetchMock.post(testUri, authFailureResponse, { overwriteRoutes: true });
    await afc.bulkSubscribe(subscriptions).catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.reset();
});
