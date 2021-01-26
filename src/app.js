import * as riot from "riot";
import { installReduxPlugin } from "ReduxImpl/RiotReduxPlugin";
import { installTranslationPlugin } from "riot/RiotTranslationPlugin";
import App from "RiotTags/App.riot.html";
import "js/OnlineStatus"
import "./scss/canoe.scss";
import { updateUserFromLocalStorage } from "js/AuthenticationUtilities"
import { Manifest } from "ts/Implementations/Manifest";
import { InitialiseCertChain } from "ts/StartUp";
import { initializeCompletions } from "js/InitializeCompletions";
import { initialiseRouting } from "js/Routing"
import { initialiseBrowserSupport } from "js/BrowserSupport"

updateUserFromLocalStorage();
initialiseBrowserSupport();
initialiseRouting();
initializeCompletions();

const manifest = new Manifest();
if(!manifest.isValid){
    try {
        manifest.initialiseByRequest();
    } finally {
        // swallow this error
    }
}

if (
    !window.certChain
) {
    InitialiseCertChain();
}

riot.install(function (component) {
    // all components will pass through here
    installTranslationPlugin(component);
    installReduxPlugin(component);
});

riot.register("app", App);
riot.mount("app");
