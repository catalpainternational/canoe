import "babel-polyfill";

import { store } from "ReduxImpl/Store";
import { initializeServiceWorker } from "js/ServiceWorkerManagement"

let storeState = store.getState();

initializeServiceWorker();

store.subscribe( () => {
    const newStoreState = store.getState();
    if(newStoreState.serviceWorker !== storeState.serviceWorker) {
        switch(newStoreState.serviceWorker) {
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
