import gettext_js from "gettext.js";
import tetumTranslations from "../../locale/tet/bero.json";
import frenchTranslations from "../../locale/fr/bero.json";

import {
    getLanguage,
    changeLanguage,
    subscribeToStore,
} from "ReduxImpl/Interface";

var i18n = new gettext_js();

// The local storage key used to store the language selected by the user
export const LANGUAGE_STORAGE_KEY = "userLanguage";
/* A list of languages the product currently supports (translations exist) */
export const AVAILABLE_LANGUAGES = {
    en: "English",
    fr: "Francais",
    tet: "Tetum",
};
export const SUPPORTED_LANG_CODES = process.env.LANGUAGES;

export function initialiseLanguage() {
    let language = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const envLanguage = process.env.CANOE_DEFAULT_LANGUAGE;

    // Allow an env-set default language.
    if (SUPPORTED_LANG_CODES.includes(envLanguage)) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, envLanguage);
        language = envLanguage;
    }

    if (!language || !SUPPORTED_LANG_CODES.includes(language)) {
        // we don't have a valid locally stored language key
        // check all supported languages for a match with browser config
        for (const code of SUPPORTED_LANG_CODES) {
            if (navigator.language.startsWith(code)) {
                language = code;
                break;
            }
        }
    }
    if (!language) {
        // we still don't have a language, just use the first available
        language = SUPPORTED_LANG_CODES[0];
    }
    changeLanguage(language);
}

// gettext.js seems to behave wrong when passed a nplurals 1 translation set
// A temporary fix pending further investigation is to
// iterate over all array value tranlsations adding a fake n=2 message
Object.values(tetumTranslations)
    .filter(Array.isArray)
    .forEach((arr) => {
        arr.push(arr[0]);
    });

i18n.loadJSON(tetumTranslations, "messages");
i18n.loadJSON(frenchTranslations, "messages");

export function gettext(msgid /* , extra */) {
    return i18n.gettext.apply(
        i18n,
        [msgid].concat(Array.prototype.slice.call(arguments, 1))
    );
}

export function ngettext(msgid, msgid_plural, n /* , extra */) {
    return i18n.ngettext.apply(
        i18n,
        [msgid, msgid_plural, n].concat(
            Array.prototype.slice.call(arguments, 3)
        )
    );
}

function setLocale(locale) {
    i18n.setLocale(locale);
}

function updateLocaleIfLanguageChanged() {
    const newLanguageState = getLanguage();
    if (newLanguageState !== previousLanguageState) {
        setLocale(newLanguageState);
    }
    previousLanguageState = newLanguageState;
}

let previousLanguageState = getLanguage();
const unsubscribe = subscribeToStore(updateLocaleIfLanguageChanged);
