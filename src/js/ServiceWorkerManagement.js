/*
 * ServiceWorkerManagement module
 */
import { register } from "register-service-worker";

import { logNotificationReceived } from "js/GoogleAnalytics";
import { gettext } from "js/Translation";

const reloadIfNewServiceWorkerIsAvailable = () => {
    let refreshing;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        // We'll also need to add 'refreshing' to our data originally set to false.
        if (refreshing) return;
        refreshing = true;
        // Here the actual reload of the page occurs
        window.location.reload();
    });
};

const ENG_STRINGS = {
    updatesAreAvailable: gettext(
        `A new version of the application is available. Click OK to load the new version.`
    ),
};

export async function initializeServiceWorker() {
    if (!navigator.serviceWorker) {
        return;
    }

    register("/sw.js", {
        registrationOptions: { scope: "./" },
        ready(registration) {
            reloadIfNewServiceWorkerIsAvailable();
            console.log("Service worker is active.");
        },
        registered(registration) {
            console.log("Service worker has been registered.");
        },
        cached(registration) {
            console.log("Content has been cached for offline use.");
        },
        updatefound(registration) {
            console.log("New content is downloading.");
        },
        updated(registration) {
            console.log("New content is available; please refresh.");
            if (!registration.waiting) {
                return;
            }
            const shouldUpdate = confirm(ENG_STRINGS.updatesAreAvailable);

            if (shouldUpdate) {
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
        },
        offline() {
            console.log("No internet connection found. App is running in offline mode.");
        },
        error(error) {
            console.error("Error during service worker registration:", error);
        },
    });

    window.addEventListener("message", (event) => {
        const type = event.data;
        logNotificationReceived(type);
    });
}
