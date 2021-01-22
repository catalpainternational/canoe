import * as riot from "riot";
import { installReduxPlugin } from "ReduxImpl/RiotReduxPlugin";
import { installTranslationPlugin } from "riot/RiotTranslationPlugin";
import "js/OnlineStatus"
import App from "RiotTags/App.riot.html";
import "./scss/canoe.scss";

riot.install(function (component) {
    // all components will pass through here
    installTranslationPlugin(component);
    installReduxPlugin(component);
});

riot.register("app", App);
riot.mount("app");
