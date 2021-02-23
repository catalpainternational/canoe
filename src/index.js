import "babel-polyfill";

import { initializeServiceWorker } from "js/ServiceWorkerManagement";
import { InitialiseCanoeHost } from "ts/StartUp";

// Create the global canoeHost and certChain objects
var canoeHost = null;
var certChain = null;
// Initialise the canoeHost object
InitialiseCanoeHost();
initializeServiceWorker();

import(/* webpackChunkName: "app" */ "./app.js");
