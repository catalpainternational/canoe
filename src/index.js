import "babel-polyfill";

import { initializeServiceWorker } from "js/ServiceWorkerManagement";

// Initialise the canoeHost object
initializeServiceWorker();

import(/* webpackChunkName: "app" */ "./app.js");
