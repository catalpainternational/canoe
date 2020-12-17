import test from "ava";
import fetchMock from "fetch-mock";
import { Response } from "node-fetch";

import { buildFakeNavigator } from "./fakeNavigator";

import { AppelflapConnect } from "../AppelflapConnect";

test.before((t: any) => {
    t.context["testPort"] = 9090;
    global["navigator"] = buildFakeNavigator(t.context.testPort);
    t.context["afc"] = new AppelflapConnect();
});

test("getPortNo (Appelflap test)", (t: any) => {
    t.is(
        t.context.afc.portNo,
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
    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.insLock}`;
    const successResponse = new Response("ok", {
        status: 200,
        statusText: "Ok",
    });
    const authFailureResponse = new Response(undefined, {
        status: 401,
        statusText: "Not Authorized",
    });

    fetchMock.put(testUri, successResponse);
    const successResult = await afc.lock();
    t.is(successResult, "ok");

    fetchMock.put(testUri, authFailureResponse);
    await afc.lock().catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.reset();
});

test("Cache: unlock", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.cacheApi}/${afc.insLock}`;
    const successResponse = new Response("ok", {
        status: 200,
        statusText: "Ok",
    });
    const authFailureResponse = new Response(undefined, {
        status: 401,
        statusText: "Not Authorized",
    });

    fetchMock.delete(testUri, successResponse);
    const successResult = await afc.unlock();
    t.is(successResult, "ok");

    fetchMock.delete(testUri, authFailureResponse);
    await afc.unlock().catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.reset();
});

test("Cache: status", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
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
    const authFailureResponse = new Response(undefined, {
        status: 401,
        statusText: "Not Authorized",
    });

    fetchMock.get(testUri, successResponse);
    const successResult = await afc.getCacheStatus();
    t.deepEqual(successResult, testResponse);

    fetchMock.get(testUri, authFailureResponse);
    await afc.getCacheStatus().catch((reason) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.reset();
});

test("Cache: canoe reboot", async (t: any) => {
    const afc = t.context.afc as AppelflapConnect;
    const testUri = `${afc.localHostURI}:${t.context.testPort}/${afc.actionApi}/${afc.reboot}`;

    const successResponse = new Response("ok", {
        status: 200,
        statusText: "Ok",
    });
    const authFailureResponse = new Response(undefined, {
        status: 401,
        statusText: "Not Authorized",
    });

    fetchMock.post(testUri, successResponse);
    const successResult = await afc.doReboot();
    t.is(successResult, "ok");

    fetchMock.post(testUri, authFailureResponse);
    await afc.doReboot().catch((reason: any) => {
        t.is(reason, "Not Authorized");
    });

    fetchMock.reset();
});
