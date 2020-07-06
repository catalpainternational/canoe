import { createStore } from "redux";

import {
    reducers,
    UPDATED_MANIFEST,
    SITE_DOWNLOADED,
    ADDED_WAGTAIL_PAGE,
    ADDED_HOME_PAGE,
    ADDED_COURSE_PAGE,
    ADDED_LESSON_PAGE,
    UPDATED_BROWSER_SUPPORT,
    LANGUAGE_CHANGE,
    SERVICE_WORKER_EVENT,
} from "./_Reducers";

const LANGUAGE_STORAGE_KEY = "userLanguage";

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

export const storeWagtailPage = (wagtailPage) => {
    switch (wagtailPage.meta.type) {
        case "elearning_content.HomePage":
            store.dispatch({ type: ADDED_HOME_PAGE, home: wagtailPage });
            break;
        case "elearning_content.CoursePage":
            store.dispatch({ type: ADDED_COURSE_PAGE, course: wagtailPage });
            break;
        case "elearning_content.LessonPage":
            store.dispatch({ type: ADDED_LESSON_PAGE, lesson: wagtailPage });
            break;
        case "elearning_content.ResourcesRoot":
            // Ignore the ResourcesRoot' root.
            return;
        case "elearning_content.ResourceArticle":
            // Ignore ResourceArticle.
            return;
        case "wagtailtrans.TranslatableSiteRootPage":
            // Ignore the i18nized site's root.
            return;
        default:
            throw new Error(`${wagtailPage.meta.type} is an unreckognized page type.`);
    }
    store.dispatch({ type: ADDED_WAGTAIL_PAGE, wagtailPage });
};

export const storeManifest = (manifest) => {
    store.dispatch({ type: UPDATED_MANIFEST, manifest });
};

export const storeSiteDownloadedIs = (trueOrFalse) => {
    store.dispatch({ type: SITE_DOWNLOADED, siteIsDownloaded: trueOrFalse });
};

export const changeLanguage = (language) => {
    store.dispatch({ type: LANGUAGE_CHANGE, language: language });

    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};

export const serviceWorkerEvent = (event_type) => {
    store.dispatch({ type: SERVICE_WORKER_EVENT, event_type: event_type });
};

export const getLanguage = () => {
    return store.getState().language;
};

export const storeBrowserSupport = (trueOrFalse) => {
    store.dispatch({ type: UPDATED_BROWSER_SUPPORT, isBrowserSupported: trueOrFalse });
};

export const getWagtailPageFromStore = (pageId) => {
    return store.getState().pages[pageId];
};

export const getManifestFromStore = () => {
    return store.getState().manifest;
};

export const isSiteDownloaded = () => {
    return store.getState().siteIsDownloaded;
};

export const isBrowserSupported = () => {
    return store.getState().isBrowserSupported;
};

export const getCourse = (courseId) => {
    const course = store.getState().courses[courseId];
    return course;
};

export const getLesson = (lessonId) => {
    const lesson = store.getState().lessons[lessonId];
    return lesson;
};
