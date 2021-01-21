import "babel-polyfill";

import { subscribeToStore, getServiceWorkerState } from "ReduxImpl/Interface";
import { initializeServiceWorker } from "js/ServiceWorkerManagement";

import { InitialiseCanoeHost } from "ts/StartUp";

import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { MANIFESTV0_CACHE_NAME, MANIFESTV1_CACHE_NAME, EMPTY_SLATE_BOOT_KEY } from "ts/Constants";

let currentServiceWorkerState = getServiceWorkerState();

// Create the global canoeHost and certChain objects
var canoeHost = null;
var certChain = null;
// Initialise the canoeHost object
InitialiseCanoeHost();

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
            // hide the loading splash
            record_bootstate().then(_is_nonblank_slate => {
                document.querySelector("#preapp-messages").hidden = true;
                import(/* webpackChunkName: "app" */ "./app.js");
            });
            break;
        case "update-waiting":
            // TODO should we reload? it might interrupt something
            // should we prompt the user?
            window.location.reload(true);
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
    let manifestV0IsExtant = false;
    let manifestV1IsExtant = false;
    const cacheNames = await caches.keys();
    if (cacheNames.indexOf(MANIFESTV0_CACHE_NAME) === -1 || cacheNames.indexOf(MANIFESTV1_CACHE_NAME) === -1) {
        return manifestV0IsExtant;
    }

    try {
        manifestV0IsExtant = (await caches.open(MANIFESTV0_CACHE_NAME)).match(ROUTES_FOR_REGISTRATION.manifest) !== undefined;
    } catch {
        // Do nothing - manifestV0IsExtant is still false
    }

    try {
        manifestV1IsExtant = (await caches.open(MANIFESTV1_CACHE_NAME)).match(`${ROUTES_FOR_REGISTRATION.manifest}/v1`) !== undefined;
    } catch {
        // Do nothing - manifestV1IsExtant is still false
    }

    // Both must be empty to indicate 'empty'
    sessionStorage.setItem(EMPTY_SLATE_BOOT_KEY, !(manifestV0IsExtant || manifestV1IsExtant));

    // Both must be true to indicate we've got everything
    return manifestV0IsExtant && manifestV1IsExtant;
};

initializeServiceWorker();
