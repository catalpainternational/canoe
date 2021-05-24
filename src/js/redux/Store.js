import { createStore } from "redux";

import { reducers } from "./Reducers";

export const LANGUAGE_STORAGE_KEY = "userLanguage";

const getInitialLanguage = () => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const envLanguage = process.env.CANOE_DEFAULT_LANGUAGE;

    if (!!storedLanguage) {
        return storedLanguage;
    }
    
    // Allow an env-set default language.
    if (["tet", "en"].includes(envLanguage)) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, envLanguage);
        return envLanguage;
    }

    // Set language with the browser setting.
    if (navigator.language.includes("en")) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
        return "en";
    } else {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "tet");
        return "tet";
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
