import * as riot from "riot";
import { installReduxPlugin } from "ReduxImpl/RiotReduxPlugin";
import { installTranslationPlugin } from "riot/RiotTranslationPlugin";

import { CanoeHost } from "ts/CanoeHost";

import App from "RiotTags/App.riot.html";
import "./scss/canoe.scss";

riot.install(function (component) {
    // all components will pass through here
    installTranslationPlugin(component);
    installReduxPlugin(component);
});

riot.register("app", App);

const StartRiot = () => {
    riot.mount("app");
}

const canoeHost = new CanoeHost();
canoeHost.StartCanoe(StartRiot);
