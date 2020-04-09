import "babel-polyfill";
import * as riot from "riot";

import "./scss/olgeta.scss";
import App from "RiotTags/App.riot.html";
import { store } from "ReduxImpl/Store";

riot.register("app", App);
window.addEventListener("load", () => {
    riot.mount("app", { store });
});
