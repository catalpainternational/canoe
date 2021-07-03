import "./scss/canoe.scss";

import * as riot from "riot";
import { installReduxPlugin } from "ReduxImpl/RiotReduxPlugin";
import { installTranslationPlugin } from "riot/RiotTranslationPlugin";
import App from "RiotTags/App.riot.html";

import { initialiseOnlineStatus } from "js/OnlineStatus";
import { initialiseIdentity } from "js/AuthenticationUtilities";
import { initialiseLanguage } from "js/Translation";
import { initialiseUserActions } from "js/UserActions";
import { initialiseRouting } from "js/Routing"
import { initialiseBrowserSupport } from "js/BrowserSupport"

// Synchronous initialization
// set things we can detect immeditely before riot mounts
initialiseOnlineStatus(window);
initialiseBrowserSupport();
initialiseLanguage();

// Mount the riot UI to show the loader ASAP
riot.install(function (component) {
    // all components will pass through here
    installTranslationPlugin(component);
    installReduxPlugin(component);
});
riot.register("app", App);
const mounted = riot.mount("app");

// Asynchronous initialization
// Initialise things that require network calls or async ops
initialiseIdentity()  // Am I logged in
    .then(() => {
        // read action from api and idb
        return initialiseUserActions();
    }).then(() => {
        initialiseRouting();         // react to the navigation hash
    });
