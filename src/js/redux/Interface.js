import { store, LANGUAGE_STORAGE_KEY } from "./Store";

import { changeLanguage as changeLanguageAction } from "./ducks/i18n";
import {
    addManifest as addManifestAction,
    addPage as addPageAction,
    addHome as addHomeAction,
    addCourse as addCourseAction,
    addLesson as addLessonAction,
} from "./ducks/Site";
import { changeServiceWorkerState as serviceWorkerStateAction } from "./ducks/ServiceWorker";
import { toggleGuestBanner as toggleGuestBannerAction } from "./ducks/GuestBanner";
import { signalBrowserSupport as signalBrowserSupportAction } from "./ducks/BrowserSupport";
import { signalCompletionsAreReady as signalCompletionsReadyAction } from "./ducks/Actions";
import { signalUserLoggedIn as signalUserLoggedInAction } from "./ducks/Authentication";

export const storeWagtailPage = (wagtailPage) => {
    const { type } = wagtailPage.meta;
    switch (type) {
        case "elearning_content.HomePage":
            store.dispatch(addHomeAction(wagtailPage));
            break;
        case "elearning_content.CoursePage":
            store.dispatch(addCourseAction(wagtailPage));
            break;
        case "elearning_content.LessonPage":
            store.dispatch(addLessonAction(wagtailPage));
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
            throw new Error(`${type} is an unreckognized page type.`);
    }

    store.dispatch(addPageAction(wagtailPage));
};

export const storeManifest = (manifest) => {
    store.dispatch(addManifestAction(manifest));
};

export const changeLanguage = (language) => {
    store.dispatch(changeLanguageAction(language));

    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};

export const getLanguage = () => {
    return store.getState().language;
};

export const changeServiceWorkerState = (eventType) => {
    store.dispatch(serviceWorkerStateAction(eventType));
};

export const getServiceWorkerState = () => {
    return store.getState().serviceWorkerState;
};

export const toggleGuestBanner = (trueOrFalse) => {
    store.dispatch(toggleGuestBannerAction(trueOrFalse));
};

export const isGuestBannerVisible = () => {
    return store.getState().isGuestBannerVisible;
};

export const storeBrowserSupport = (trueOrFalse) => {
    store.dispatch(signalBrowserSupportAction(trueOrFalse));
};

export const getWagtailPageFromStore = (pageId) => {
    return store.getState().pages[pageId];
};

export const getManifestFromStore = () => {
    return store.getState().manifest;
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

export const signalCompletionsAreReady = () => {
    store.dispatch(signalCompletionsReadyAction(true));
};

export const signalCompletionsAreNotReady = () => {
    store.dispatch(signalCompletionsReadyAction(false));
};

export const areCompletionsReady = () => {
    return store.getState().areCompletionsReady;
};

// Authentication
/** Signals to the Redux Store that the User is/has Logged In */
export const signalUserLoggedIn = () => {
    store.dispatch(signalUserLoggedInAction(true));
};

/** Signals to the Redux Store that the User is/has Logged Out */
export const signalUserLoggedOut = () => {
    store.dispatch(signalUserLoggedInAction(false));
};

/** Get's the User's login state from the Redux Store */
export const isUserLoggedIn = () => {
    return store.getState().userLoggedIn;
};

export const subscribeToStore = (subscriptionFunction) => {
    return store.subscribe(subscriptionFunction);
};
