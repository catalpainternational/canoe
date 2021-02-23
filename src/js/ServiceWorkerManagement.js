/*
 * ServiceWorkerManagement module
 */
import { Workbox } from "workbox-window";

import { logNotificationReceived } from "js/GoogleAnalytics";
import { ROUTES_FOR_REGISTRATION } from "js/urls";
import { MANIFEST_CACHE_NAME, EMPTY_SLATE_BOOT_KEY } from "ts/Constants";
import { gettext } from "js/Translation";

/** Sets a sessionStorage item signifying whether we are booting into a:
 * - preseeded state (either through Appelflap cache injection, or autonomous buildup), or
 * - blank slate.
 *
 * We use the presence of the manifest as an indication for this.
 * @remarks Can be used as a fence by awaiting its promise.
 * @returns true when a manifest can be found, false otherwise.
 */
const recordBootstate = async () => {
    let manifestIsExtant = false;
    const cacheNames = await caches.keys();
    if (cacheNames.indexOf(MANIFEST_CACHE_NAME) === -1) {
        return manifestIsExtant;
    }

    try {
        const aMatch = await caches
            .open(MANIFEST_CACHE_NAME)
            .match(ROUTES_FOR_REGISTRATION.manifest);
        manifestIsExtant = aMatch !== undefined;
    } catch {
        // Do nothing - manifestIsExtant is still false
    }

    // indicate 'empty'
    sessionStorage.setItem(EMPTY_SLATE_BOOT_KEY, !manifestIsExtant);

    // indicate we've got everything
    return manifestIsExtant;
};

export async function initializeServiceWorker() {
    if (!navigator.serviceWorker) {
        return;
    }

    const wb = new Workbox("/sw.js");

    wb.addEventListener("installed", (event) => {
        if (event.isUpdate) {
            const refreshForNewVersionMessage = gettext(
                `New content is available! Click OK to refresh.`
            );
            if (confirm(refreshForNewVersionMessage)) {
                window.location.reload();
            }
        }
    });

    wb.addEventListener("controlling", () => {
        recordBootstate();
    });

    wb.addEventListener("message", (event) => {
        const type = event.data;
        logNotificationReceived(type);
    });

    wb.register();
}
