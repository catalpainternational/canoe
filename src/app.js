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

riot.install(function (component) {
    // all components will pass through here
    installTranslationPlugin(component);
    installReduxPlugin(component);
});

riot.register("app", App);
const mounted = riot.mount("app");

initialiseIdentity();
initialiseOnlineStatus(window);
initialiseBrowserSupport();
initialiseRouting();
initialiseUserActions();
initialiseFeedback();
// InitialiseCertChain is done after login or valid initialiseIdentity with a token

