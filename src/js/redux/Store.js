import { createStore } from "redux";

import { reducers } from "./Reducers";

export const LANGUAGE_STORAGE_KEY = "userLanguage";

const TETUN_LANG_CODE = "tet";
const ENGLISH_LANG_CODE = "en";

const getInitialLanguage = () => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const envLanguage = process.env.CANOE_DEFAULT_LANGUAGE;

    if (!!storedLanguage) {
        return storedLanguage;
    }

    // Allow an env-set default language.
    if ([TETUN_LANG_CODE, ENGLISH_LANG_CODE].includes(envLanguage)) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, envLanguage);
        return envLanguage;
    }

    // Set language with the browser setting.
    if (navigator.language.includes(ENGLISH_LANG_CODE)) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, ENGLISH_LANG_CODE);
        return ENGLISH_LANG_CODE;
    } else {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, ENGLISH_LANG_CODE);
        return ENGLISH_LANG_CODE;
    }
};

const initialStoreState = {
    language: getInitialLanguage(),
};

export const store = createStore(
    reducers,
    initialStoreState,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
