import "babel-polyfill";

import { store } from "ReduxImpl/Store";
import { initializeServiceWorker } from "js/ServiceWorkerManagement"

let storeState = store.getState();

store.subscribe( () => {
    const newStoreState = store.getState();
    if(newStoreState.serviceWorker === storeState.serviceWorker) {
        return;
    }

    switch(newStoreState.serviceWorker) {
        case "install-failed":
            document.querySelector("#service-worker-loading").hidden = true;
            document.querySelector("#service-worker-notsupported").hidden = true;
            document.querySelector("#service-worker-failed").hidden = false;
            break;
        case "notsupported":
            document.querySelector("#service-worker-loading").hidden = true;
            document.querySelector("#service-worker-notsupported").hidden = false;
            break;
        case "installed":
            // hide the loading splash
            document.querySelector("#preapp-messages").hidden = true;
            import(/* webpackChunkName: "app" */ "./app.js")
            break;
        case "updated":
            // TODO should we reload? it might interrupt something
            // should we prompt the user?
            window.location.reload(true);
            break;
        default:
            break;
    }
});

initializeServiceWorker();
