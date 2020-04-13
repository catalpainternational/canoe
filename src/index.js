import "babel-polyfill";

import { store } from "ReduxImpl/Store";
import { initializeServiceWorker } from "js/ServiceWorkerManagement"

let storeState = store.getState();

store.subscribe( () => {
    const newStoreState = store.getState();
    if(newStoreState.serviceWorker !== storeState.serviceWorker) {

        switch(newStoreState.serviceWorker) {
            case 'notsupported':
                document.querySelector('#service_worker_loading').hidden = true;
                document.querySelector('#service_worker_notsupported').hidden = false;
                break;
            case 'installed':
                // hide the loading splash
                document.querySelector('#canoe_loading').hidden = true;
                import(/* webpackChunkName: "app" */ "./app.js")
                break;
            case 'updated':
                // TODO should we reload? it might interrupt something
                // should we prompt the user?
                window.location.reload(true);
                break;
            default:
                break;
        }
    }
});

initializeServiceWorker();
