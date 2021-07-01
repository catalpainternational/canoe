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

import { initialiseCertChain } from "ts/Appelflap/StartUp";

// Synchronous initialization
// set things we can detect immeditely before riot mounts
initialiseOnlineStatus(window);
initialiseBrowserSupport();

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
        // perform independent actions that require login in parallel
        return Promise.all([
            initialiseUserActions(), // read actiion from api and idb
            initialiseCertChain(),   // initialise the appelflap package publishing cert
        ]);
    }).then(() => {
        initialiseRouting();         // react to the navigation hash
    });
