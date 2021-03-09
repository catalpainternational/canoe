import { createStore } from "redux";

import { reducers } from "./Reducers";

export const LANGUAGE_STORAGE_KEY = "userLanguage";

const getInitialLanguage = () => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (!!storedLanguage) {
        return storedLanguage;
    } else if (navigator.language.includes("en")) {
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
