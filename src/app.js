import * as riot from "riot";
import { installReduxPlugin } from "ReduxImpl/RiotReduxPlugin";
import { installTranslationPlugin } from "riot/RiotTranslationPlugin";

import { getPlatform } from "js/PlatformDetection";
import { AppelflapConnect } from "ts/AppelflapConnect";

import App from "RiotTags/App.riot.html";
import "./scss/canoe.scss";

riot.install(function (component) {
    // all components will pass through here
    installTranslationPlugin(component);
    installReduxPlugin(component);
});

riot.register("app", App);

const inAppelflap = () => {
    const { browser, inAppelflap, inPWAMode } = getPlatform();
    return inAppelflap;
};

/** Tell Appelflap that Canoe is 'locked'
 * and should not be rebooted */
const lockCanoe = async () => {
    const appelflapConnect = new AppelflapConnect();
    return await appelflapConnect.lock();
};

if (inAppelflap()) {
    lockCanoe()
        .then((lockResult) => {
            if (lockResult !== "ok") {
                // The lock didn't succeed, the app is probably still usable.
                // We don't yet understand what this means for the user and the app.
                // Should we show a small warning?
            }

            riot.mount("app");
        })
        .catch((_) => {
            /* Do nothing */
        });
} else {
    riot.mount("app");
}

lockCanoe();
