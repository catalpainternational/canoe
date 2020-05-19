/* ServiceWorkerManagement module
 * 
 *
 */
import { Workbox } from "workbox-window";
import { serviceWorkerEvent } from "ReduxImpl/Store";
const SW_UPDATE_INTERVAL = 1000 * 10 * 60 * 4;
import { logNotificationReceived } from "js/GoogleAnalytics"
import { ON_ADD_TO_HOME_SCREEN } from "js/Events";


export async function initializeServiceWorker() {
    if (!navigator.serviceWorker) {
        serviceWorkerEvent("notsupported")
        return;
    }

    const wb = new Workbox("/sw.js");

    wb.controlling.then(sw => {
        // This happens:
        // a fresh first time visit once the sw is in control
        // a refresh when there is an active sw to take control
        serviceWorkerEvent("controlling")

        function checkForNewVersion() {
            console.log("checking for new version");
            if( wb ) {
                wb.update();
            }
        }

        const swUpdatePoller = window.setInterval(checkForNewVersion, SW_UPDATE_INTERVAL);
    });


    wb.addEventListener("externalinstalled", (e) => {
        // workbox detects a new service worker installed ready for activation ( sometimes )
        serviceWorkerEvent("update-waiting")
    });

    wb.addEventListener("redundant", (e) => {
        // This happens:
        // when service worker fails to install
        // when a new service worker takes over control ( sometimes )
        serviceWorkerEvent("redundant")
    });

    wb.addEventListener("message", (event) => {
        const type = event.data;
        logNotificationReceived(type);
    });

    wb.register();

    window.addEventListener("beforeinstallprompt", async (e) => {
        e.preventDefault();
        const deferredPrompt = e;

        window.addEventListener(ON_ADD_TO_HOME_SCREEN, async () => {
            deferredPrompt.prompt();
        });
    });

}
