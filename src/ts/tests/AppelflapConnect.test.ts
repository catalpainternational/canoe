import test from "ava";
import fetchMock from "fetch-mock";

import { buildFakeNavigator } from "./fakeNavigator";

import { AppelflapConnect } from "../AppelflapConnect";

test("getPortNo (Appelflap test)", (t: any) => {
    const testPort = 9090;
    global["navigator"] = buildFakeNavigator(testPort);
    const afc = new AppelflapConnect();
    t.is(
        afc.getPortNo(),
        testPort,
        "navigator has encoded portNo - implies Appelflap"
    );

    global["navigator"] = buildFakeNavigator();
    const nfc = new AppelflapConnect();
    t.is(
        nfc.getPortNo(),
        -1,
        "navigator does not have encoded portNo - implies no Appelflap"
    );
});

test("getMetaStatus", (t: any) => {
    const testPort = 9090;
    global["navigator"] = buildFakeNavigator(testPort);

    const localHostURI = "http://127.0.0.1";
    const metaApi = "meta";
    const status = "status";
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
    fetchMock.get(`${localHostURI}:${testPort}/${metaApi}/${status}`, state);

    const afc = new AppelflapConnect();

    return afc.getMetaStatus().then((result: any) => {
        fetchMock.reset();
        t.deepEqual(result, state);
    });
});
