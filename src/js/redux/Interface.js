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
import { changeOnlineAction } from "./ducks/Online";
import { setAuthenticatedState, setUserDetailsState} from "./ducks/Identity";
import { setCanoePage } from "./ducks/Route";

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
    const b =  store.getState().isBrowserSupported;
    return b;
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

export const isOnline = () => {
    return store.getState().online;
};

export const setOnline = () => {
    store.dispatch(changeOnlineAction(true));
}

export const setOffline = () => {
    store.dispatch(changeOnlineAction(false));
}

export const isAuthenticated = () => {
    return store.getState().identity.isAuthenticated;
};

export const getUser = () => {
    return store.getState().identity.user;
};

export const setAuthenticated = (user) => {
    store.dispatch(setAuthenticatedState(user));
}

export const setUnauthenticated = () => {
    store.dispatch(setUnAuthenticatedState());
}

export const setUser = (user) => {
    store.dispatch(setUserDetailsState(user));
}

export const setRoute = (route) => {
    store.dispatch(setCanoePage(route));
}

export const getRoute = () => {
    return store.getState().route;
};

export const subscribeToStore = (subscriptionFunction) => {
    return store.subscribe(subscriptionFunction);
};
