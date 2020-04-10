import "babel-polyfill";

import { store } from "ReduxImpl/Store";
import { initializeServiceWorker } from "js/ServiceWorkerManagement"

let storeState = store.getState();

store.subscribe( () => {
    const newStoreState = store.getState();
    if(newStoreState.serviceWorker !== storeState.serviceWorker) {
        // hide the loading splash
        document.querySelector('#canoe_loading').hidden = true;

        switch(newStoreState.serviceWorker) {
            case 'notsupported':
                document.querySelector('#service_worker_notsupported').hidden = false;
                return;
            case 'installed':
                import(/* webpackChunkName: "app" */ "./app.js")
                return;
            case 'updated':
                // TODO should we reload? it might interrupt something
                // should we prompt the user?
                window.location.reload(true);
                return;
            default:
                return;
        }
    }
});

initializeServiceWorker();
