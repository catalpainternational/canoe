import "./scss/canoe.scss";

import * as riot from "riot";
import { installReduxPlugin } from "ReduxImpl/RiotReduxPlugin";
import { installTranslationPlugin } from "riot/RiotTranslationPlugin";
import App from "RiotTags/App.riot.html";

import { initialiseOnlineStatus } from "js/OnlineStatus";
import { initialiseIdentity } from "js/AuthenticationUtilities";
import { initialiseUserActions } from "js/UserActions";
import { initialiseRouting } from "js/Routing"
import { initialiseBrowserSupport } from "js/BrowserSupport"
import initialiseFeedback from "js/Telemetry";
import { initialiseCertChain } from "ts/StartUp";

// Syncronous initialization
initialiseOnlineStatus(window);
initialiseBrowserSupport();

riot.install(function (component) {
    // all components will pass through here
    installTranslationPlugin(component);
    installReduxPlugin(component);
});

riot.register("app", App);
const mounted = riot.mount("app");

// Asynchronous initialization
initialiseIdentity()
    .then(() => {
        return Promise.all([
            initialiseUserActions(),
            initialiseFeedback(),
            initialiseCertChain(),
        ]);
    }).then(() => {
        initialiseRouting();
    });

