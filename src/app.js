import * as riot from "riot";
import { installReduxPlugin } from "ReduxImpl/RiotReduxPlugin";
import { installTranslationPlugin } from "RiotTranslationPlugin";

import App from "RiotTags/App.riot.html";
import { store, changeLanguage, getLanguage } from "ReduxImpl/Store";
import "./scss/canoe.scss";

const LANGUAGE_STORAGE_KEY = "userLanguage";
const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

if (!!storedLanguage) {
    changeLanguage(storedLanguage);
} else if (navigator.language.includes("en")) {
    changeLanguage("en");
} else {
    changeLanguage("tet");
}

riot.install(function (component) {
    // all components will pass through here
    installTranslationPlugin(component);
    installReduxPlugin(component, store);
});

riot.register("app", App);
riot.mount("app", { store });
