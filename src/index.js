import "babel-polyfill";
import "translation";
import * as riot from "riot";
import { installReduxPlugin } from "ReduxImpl/RiotReduxPlugin";
import { installTranlsationPlugin } from "riot-translation-plugin";

import App from "RiotTags/App.riot.html";
import { store } from "ReduxImpl/Store";

import "./scss/olgeta.scss";

riot.install(function(component) {
    // all components will pass through here
    installTranlsationPlugin(component);
    installReduxPlugin(component, store);
})


riot.register("app", App);

window.addEventListener("load", () => {
    riot.mount("app", { store });
});
