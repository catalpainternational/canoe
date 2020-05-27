import * as riot from "riot";
import { installReduxPlugin } from "ReduxImpl/RiotReduxPlugin";
import { installTranslationPlugin } from "RiotTranslationPlugin";

import App from "RiotTags/App.riot.html";
import { store } from "ReduxImpl/Store";
import "./scss/canoe.scss";

riot.install(function (component) {
    // all components will pass through here
    installTranslationPlugin(component);
    installReduxPlugin(component, store);
});

riot.register("app", App);
riot.mount("app", { store });
