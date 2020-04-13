/* ServiceWorkerManagement module
 * 
 *
 */
import { Workbox } from 'workbox-window';
import { serviceWorkerEvent } from "ReduxImpl/Store";
const SW_UPDATE_INTERVAL = 1000 * 10 * 60 * 4;
import { ON_ADD_TO_HOME_SCREEN } from "js/Events";


export async function initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
        const wb = new Workbox('/sw.js');

        wb.addEventListener('externalactivated', () => {
            serviceWorkerEvent('externalactivated')
        });
        
        wb.register();
        
        navigator.serviceWorker.ready.then(sw=>{
            serviceWorkerEvent('installed')

            function checkForNewVersion() {
                console.log('checking for new version');
                if( wb ) {
                    wb.update();    
                }
            }
            
            const swUpdatePoller = window.setInterval(checkForNewVersion, SW_UPDATE_INTERVAL);
        });

        window.addEventListener("beforeinstallprompt", async (e) => {
            e.preventDefault();
            const deferredPrompt = e;

            window.addEventListener(ON_ADD_TO_HOME_SCREEN, async () => {
                deferredPrompt.prompt();
            });
        });
    } else {
        serviceWorkerEvent('notsupported')
    }
}
