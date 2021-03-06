/* ServiceWorkerManagement module
 * 
 *
 */
import { Workbox } from "workbox-window";
import { changeServiceWorkerState } from "ReduxImpl/Interface";
import { logNotificationReceived } from "js/GoogleAnalytics"
import { ON_ADD_TO_HOME_SCREEN } from "js/Events";

const SW_UPDATE_INTERVAL = 1000 * 10 * 60 * 4;

export const SKIP_SW = process.env.SKIP_SW;

export async function initializeServiceWorker() {
    if(SKIP_SW) {
        changeServiceWorkerState("skip_sw");
        return;
    }
    if (!navigator.serviceWorker) {
        changeServiceWorkerState("notsupported")
        return;
    }

    const wb = new Workbox("/sw.js");

    wb.controlling.then(sw => {
        // This happens:
        // a fresh first time visit once the sw is in control
        // a refresh when there is an active sw to take control
        changeServiceWorkerState("controlling")

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
        changeServiceWorkerState("update-waiting")
    });

    wb.addEventListener("redundant", (e) => {
        // This happens:
        // when service worker fails to install
        // when a new service worker takes over control ( sometimes )
        changeServiceWorkerState("redundant")
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
