import test from "ava";

import { buildFakeNavigator } from "./fakeNavigator";

import { AppelflapConnect } from "../AppelflapConnect";

test("getPortNo Success", (t: any) => {
    const afc = new AppelflapConnect();

    global["navigator"] = buildFakeNavigator();

    t.is(afc.getPortNo(), 123);
});
