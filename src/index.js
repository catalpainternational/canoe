import "babel-polyfill";

import { subscribeToStore, getServiceWorkerState } from "ReduxImpl/Interface";
import { initializeServiceWorker } from "js/ServiceWorkerManagement";

import { InitialiseBeroHost } from "ts/Appelflap/StartUp";

import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { EMPTY_SLATE_BOOT_KEY } from "ts/Constants";

let currentServiceWorkerState = getServiceWorkerState();

// Create the global beroHost and certChain objects
var beroHost = null;
var certChain = null;
// Initialise the beroHost object
InitialiseBeroHost();

subscribeToStore(() => {
    const newServiceWorkerState = getServiceWorkerState();
    if (newServiceWorkerState === currentServiceWorkerState) {
        return;
    }

    switch (newServiceWorkerState) {
        case "install-failed":
            // show a retry message
            document.querySelector("#service-worker-loading").hidden = true;
            document.querySelector("#service-worker-notsupported").hidden = true;
            document.querySelector("#service-worker-failed").hidden = false;
            break;
        case "notsupported":
            document.querySelector("#service-worker-loading").hidden = true;
            document.querySelector("#service-worker-notsupported").hidden = false;
            break;
        case "controlling":
        case "skip_sw":
            // hide the loading splash
            record_bootstate().then(_is_nonblank_slate => {
                document.querySelector("#preapp-messages").hidden = true;
                import(/* webpackChunkName: "app" */ "./app.js");
            });
            break;
        case "update-waiting":
            // TODO should we reload? it might interrupt something
            // should we prompt the user?
            window.location.reload();
            break;
        default:
            break;
    }
    // store state for next time
    currentServiceWorkerState = getServiceWorkerState();
});

/** Sets a sessionStorage item signifying whether we are booting into a:
 * - preseeded state (either through Appelflap cache injection, or autonomous buildup), or
 * - blank slate.
 * 
 * We use the presence of the manifest as an indication for this.
 * @remarks Can be used as a fence by awaiting its promise.
 * @returns true when a manifest can be found, false otherwise.
 */
const record_bootstate = async () => {
    const cacheNames = await caches.keys();
    let manifestIsExtant = (cacheNames.indexOf(ROUTES_FOR_REGISTRATION.manifest) !== -1);
    // indicate 'empty'
    sessionStorage.setItem(EMPTY_SLATE_BOOT_KEY, !manifestIsExtant);

    // indicate what we've got
    return manifestIsExtant;
};

initializeServiceWorker();
