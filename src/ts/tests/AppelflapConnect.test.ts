import test from "ava";
import fetchMock from "fetch-mock";
import { Response } from "node-fetch";

import { buildFakeNavigator } from "./fakeNavigator";

import { AppelflapConnect } from "../AppelflapConnect";

test("getPortNo (Appelflap test)", (t: any) => {
    const testPort = 9090;
    global["navigator"] = buildFakeNavigator(testPort);
    const afc = new AppelflapConnect();
    t.is(
        afc.portNo,
        testPort,
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
    const testPort = 9090;
    global["navigator"] = buildFakeNavigator(testPort);

    const afc = new AppelflapConnect();
    const testUri = `${afc.localHostURI}:${testPort}/${afc.metaApi}/${afc.status}`;

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
    const testPort = 9090;
    global["navigator"] = buildFakeNavigator(testPort);

    const afc = new AppelflapConnect();
    const testUri = `${afc.localHostURI}:${testPort}/${afc.cacheApi}/${afc.insLock}`;
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
