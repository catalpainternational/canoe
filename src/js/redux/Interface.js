import { store, LANGUAGE_STORAGE_KEY } from "./Store";

import { changeLanguage as changeLanguageAction } from "./ducks/i18n";
import {
    addManifestAction,
    addPageAction,
    fetchingManifestAction
} from "./ducks/Site";
import { changeServiceWorkerState as serviceWorkerStateAction } from "./ducks/ServiceWorker";
import { toggleGuestBanner as toggleGuestBannerAction } from "./ducks/GuestBanner";
import { signalBrowserSupport as signalBrowserSupportAction } from "./ducks/BrowserSupport";
import { signalCompletionsAreReady as signalCompletionsReadyAction } from "./ducks/Actions";
import { changeOnlineAction } from "./ducks/Online";
import { setAuthenticatedState, setUnAuthenticatedState } from "./ducks/Identity";
import { setCanoePage } from "./ducks/Route";
import { addItemStorageStatusAction } from "./ducks/ItemStorageStatus";

export const storePageData = (pageId, pageData) => {
    store.dispatch(addPageAction(pageId, pageData));
};

export const getPageData = (pageId) => {
    let pages = store.getState().pages;
    return pages[pageId];
};

export const storeManifest = (manifest) => {
    store.dispatch(addManifestAction(manifest));
};

export const getManifestFromStore = () => {
    return store.getState().manifest;
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

export const setRoute = (route, riotHash) => {
    store.dispatch(setCanoePage(route, riotHash));
}

export const getRoute = () => {
    return store.getState().route;
};

export const setFetchingManifest = (fetching) => {
    store.dispatch(fetchingManifestAction(fetching));
};

export const subscribeToStore = (subscriptionFunction) => {
    return store.subscribe(subscriptionFunction);
};

export const storeItemStorageStatus = (itemId, itemState) => {
    store.dispatch(addItemStorageStatusAction(itemId, itemState));
};

/** Get the publishable item's storage status
 * @returns the publishable item's storage status or null
 * @remarks test for null first, before casting the return `as TItemStorageStatus`
 */
export const getItemStorageStatus = (itemId) => {
    const itemStorageStatuses = store.getState().itemStorageStatuses;
    if (itemStorageStatuses === null) {
        return itemStorageStatuses;
    }

    return itemStorageStatuses[itemId] || null;
};

/** Get the status for all publishable items storage statuses
 * @returns each publishable item's storage status as an array
 */
export const getItemStorageStatuses = () => {
    const itemStorageStatuses = store.getState().itemStorageStatuses;
    if (itemStorageStatuses === null) {
        return [];
    }

    return itemStorageStatuses;
};
