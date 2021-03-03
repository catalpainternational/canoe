import "babel-polyfill";

import { subscribeToStore, getServiceWorkerState } from "ReduxImpl/Interface";
import { initializeServiceWorker } from "js/ServiceWorkerManagement";
import { BACKEND_BASE_URL } from "js/urls.js";

let currentServiceWorkerState = getServiceWorkerState();

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
            window.location.reload(true);
            break;
        default:
            break;
    }
    // store state for next time
    currentServiceWorkerState = getServiceWorkerState();
});


const record_bootstate = () => {
    // Sets a sessionStorage item signifying whether we are booting into a preseeded state
    // (either through Appelflap cache injection, or autonomous buildup), or into a
    // blank slate. We use the presence of the manifest as an indication for this.
    // Can be used as a fence by awaiting its promise.
    // Returns true when a manifest can be found, false otherwise.
    const MANIFEST_CACHE_NAME = "manifest-cache";
    const MANIFEST_URL = `${BACKEND_BASE_URL}/manifest`;
    const EMPTY_SLATE_BOOT_KEY = "empty_slate_boot";

    return caches.keys()
        .then(cachenames => cachenames.indexOf(MANIFEST_CACHE_NAME) > -1
            && caches.open(MANIFEST_CACHE_NAME)
                .then(thecache => thecache.match(MANIFEST_URL) !== undefined)
        )
        .then(manifest_is_extant => {
            sessionStorage.setItem(EMPTY_SLATE_BOOT_KEY, !manifest_is_extant);
            return manifest_is_extant;
        });
};

initializeServiceWorker();