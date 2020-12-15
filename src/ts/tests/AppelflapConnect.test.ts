import test from "ava";

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
