import * as riot from "riot";
import { installReduxPlugin } from "ReduxImpl/RiotReduxPlugin";
import { installTranslationPlugin } from "riot/RiotTranslationPlugin";

import App from "RiotTags/App.riot.html";
import { store, changeLanguage } from "ReduxImpl/Store";
import "./scss/canoe.scss";

changeLanguage('tet');

riot.install(function (component) {
    // all components will pass through here
    installTranslationPlugin(component);
    installReduxPlugin(component, store);
});

riot.register("app", App);
riot.mount("app", { store });
