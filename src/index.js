import "babel-polyfill";
import * as riot from "riot";

import "./scss/olgeta.scss";
import App from "RiotTags/App.riot.html";
import ChangeBrowser from "RiotTags/screens/ChangeBrowser.riot.html";
import { store } from "ReduxImpl/Store";
import { getBrowserVersion } from "js/DjangoPushNotifications";

const browser = getBrowserVersion(navigator.userAgent);
const platform = navigator.platform;

if (platform.indexOf("iPhone")!=-1 && browser.name == "Chrome") {
    riot.register("changebrowser", ChangeBrowser);
    window.addEventListener("load", () => {
        riot.mount("changebrowser");
    });
} else {
    riot.register("app", App);
    window.addEventListener("load", () => {
        riot.mount("app", { store });
    });
}
