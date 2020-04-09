import gettext_js from 'gettext.js/dist/gettext.esm.js';
import tetumTranslations from "../locale/json/tet.json";
import { store } from "ReduxImpl/Store";

var i18n = gettext_js();

i18n.loadJSON(tetumTranslations, 'messages');

export function gettext(msgid /* , extra */) {
    return i18n.gettext.apply(i18n, [msgid,].concat(Array.prototype.slice.call(arguments, 1)));
}

export function ngettext(msgid, msgid_plural, n /* , extra */) {
    return i18n.ngettext.apply(i18n, [msgid, msgid_plural, n].concat(Array.prototype.slice.call(arguments, 3)));
}

export function setLocale(locale) {
    i18n.setLocale(locale);
}

function storeDispatch() {
    const newStoreState = store.getState();
    if (newStoreState.language !== previousStoreState.language) {
        setLocale(newStoreState.language);
    }
    previousStoreState = store.getState();
}

let previousStoreState = store.getState();
const unsubscribe = store.subscribe(storeDispatch);
