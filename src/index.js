import "babel-polyfill";

import { subscribeToStore, getServiceWorkerState } from "ReduxImpl/Interface";
import { initializeServiceWorker } from "js/ServiceWorkerManagement";

import { InitialiseCanoeHost } from "ts/StartUp";

import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { MANIFEST_CACHE_NAME, MANIFESTV2_CACHE_NAME, EMPTY_SLATE_BOOT_KEY } from "ts/Constants";

let currentServiceWorkerState = getServiceWorkerState();
// Create and Start up the global canoeHost object
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
    let manifestIsExtant = false;
    let manifestV2IsExtant = false;
    const cacheNames = await caches.keys();
    if (cacheNames.indexOf(MANIFEST_CACHE_NAME) === -1 || cacheNames.indexOf(MANIFESTV2_CACHE_NAME) === -1) {
        return manifestIsExtant;
    }

    try {
        manifestIsExtant = (await caches.open(MANIFEST_CACHE_NAME)).match(ROUTES_FOR_REGISTRATION.manifest) !== undefined;
    } catch {
        // Do nothing - manifestIsExtant is still false
    }

    try {
        manifestV2IsExtant = (await caches.open(MANIFESTV2_CACHE_NAME)).match(`${ROUTES_FOR_REGISTRATION.manifest}/0.0.1`) !== undefined;
    } catch {
        // Do nothing - manifestV2IsExtant is still false
    }

    // Both must be empty to indicate 'empty'
    sessionStorage.setItem(EMPTY_SLATE_BOOT_KEY, !(manifestIsExtant || manifestV2IsExtant));

    // Both must be true to indicate we've got everything
    return manifestIsExtant && manifestV2IsExtant;
};

initializeServiceWorker();
