/* ServiceWorkerManagement module
 */
import { Workbox } from "workbox-window";
import {
    saySWIsControlling,
    saySWIsNotSupported,
} from "ReduxImpl/Store";
import { ON_ADD_TO_HOME_SCREEN } from "js/Events";

const SW_UPDATE_INTERVAL = 1000 * 10 * 60 * 4;

export async function initializeServiceWorker() {
    if (!navigator.serviceWorker) {
        saySWIsNotSupported();
        return;
    }

    const wb = new Workbox("/sw.js");

    wb.register();
    saySWIsControlling();

    const checkForNewVersion = () => {
        console.log("checking for new version");
        if (wb) {
            wb.update();
        }
    };
    window.setInterval(checkForNewVersion, SW_UPDATE_INTERVAL);

    window.addEventListener("beforeinstallprompt", async (e) => {
        e.preventDefault();
        const deferredPrompt = e;

        window.addEventListener(ON_ADD_TO_HOME_SCREEN, async () => {
            deferredPrompt.prompt();
        });
    });
}
