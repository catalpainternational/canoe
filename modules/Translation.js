import Gettext from "node-gettext";
import tetumTranslations from "../locale/json/tm-tl.json";
import { store } from "ReduxImpl/Store";
const gt = new Gettext();
gt.addTranslations("tetum", "messages", tetumTranslations);
gt.on("error", (error) => console.warn("missing translation:", error));

export function getText(key) {
    return gt.gettext(key);
}

export function setLocale(locale) {
    gt.setLocale(locale);
}

function storeDispatch() {
    const newStoreState = store.getState();
    if (newStoreState.language !== previousStoreState.language) {
        gt.setLocale(newStoreState.language);
    }
    previousStoreState = store.getState();
}

let previousStoreState = store.getState();
const unsubscribe = store.subscribe(storeDispatch);
