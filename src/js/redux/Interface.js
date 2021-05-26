import { store, LANGUAGE_STORAGE_KEY } from "./Store";

import { changeLanguageAction } from "./ducks/i18n";
import { addManifestAction, addPageAction } from "./ducks/Site";
import { serviceWorkerStateAction } from "./ducks/ServiceWorker";
import { toggleGuestBannerAction } from "./ducks/GuestBanner";
import { signalBrowserSupportAction } from "./ducks/BrowserSupport";
import { clearCompletionsAction, setCompletionAction, setManyCompletionsAction } from "./ducks/Completion";
import { clearExamScoresAction, storeExamScoreAction, storeExamScoresAction } from "./ducks/ExamScores";
import { clearPageAnswersAction, storeTestAnswerAction } from "./ducks/TestAnswers";
import { changeOnlineAction } from "./ducks/Online";
import {
    setAuthenticatedState,
    setUnAuthenticatedState,
} from "./ducks/Identity";
import { setCanoePage } from "./ducks/Route";

//#region Site
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
//#endregion

//#region i18n
export const changeLanguage = (language) => {
    store.dispatch(changeLanguageAction(language));
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};
export const getLanguage = () => {
    return store.getState().language;
};
//#endregion

//#region ServiceWorker
export const changeServiceWorkerState = (eventType) => {
    store.dispatch(serviceWorkerStateAction(eventType));
};
export const getServiceWorkerState = () => {
    return store.getState().serviceWorkerState;
};
//#endregion

//#region GuestBanner
export const toggleGuestBanner = (trueOrFalse) => {
    store.dispatch(toggleGuestBannerAction(trueOrFalse));
};
export const isGuestBannerVisible = () => {
    return store.getState().isGuestBannerVisible;
};
//#endregion

//#region BrowserSupport
export const storeBrowserSupport = (trueOrFalse) => {
    store.dispatch(signalBrowserSupportAction(trueOrFalse));
};
export const isBrowserSupported = () => {
    return store.getState().isBrowserSupported;
};
//#endregion

//#region Completion
export const clearStoredCompletions = () => {
    store.dispatch(clearCompletionsAction());
};
export const storePageComplete = (pageId, date, complete) => {
    store.dispatch(setCompletionAction(pageId, date, complete));
}
export const storePageCompletions = (completions) => {
    store.dispatch(setManyCompletionsAction(completions));
}
export const getStoredPageCompletionDate = (pageId) => {
    const completions = store.getState().completions
    const pageIdInt = parseInt(pageId);
    return completions ? completions[pageIdInt] : undefined;
}
export const userActionsReady = () => {
    const state = store.getState()
    return state.completions !== null && state.examScores != null;
}
//#endregion

//#region ExamScores
export const clearExamScores = () => {
    store.dispatch(clearExamScoresAction());
}
export const storeExamScore = (pageId, score) => {
    store.dispatch(storeExamScoreAction(pageId, score));
}
export const storeExamScores = (scores) => {
    store.dispatch(storeExamScoresAction(scores));
}
export const getExamScore = (pageId) => {
    const examScores = store.getState().examScores;
    const pageIdInt = parseInt(pageId);
    return examScores ? examScores[pageIdInt] : undefined;
}
//#endregion

//#region TestAnswers
export const storeTestAnswer = (examPageId, questionId, answer) => {
    store.dispatch(storeTestAnswerAction(examPageId, questionId, answer));
}
export const clearPageTestAnswers = (pageId) => {
    store.dispatch(clearPageAnswersAction(pageId));
}
export const getTestAnswer = (examPageId, questionId) => {
    const s = store.getState();
    const answers = s.testAnswers || {};
    const pageAnswers = answers[examPageId] || {};
    return pageAnswers[questionId] || undefined;
}
export const getTestAnswers = (examPageId) => {
    const s = store.getState();
    const answers = s.testAnswers || {};
    return answers[examPageId] || [];
}
//#endregion

//#region Online
export const isOnline = () => {
    return store.getState().online;
};
export const setOnline = () => {
    store.dispatch(changeOnlineAction(true));
};
export const setOffline = () => {
    store.dispatch(changeOnlineAction(false));
};
//#endregion

//#region Identity
export const isAuthenticationDetected = () => {
    return store.getState().identity.isAuthenticated !== undefined;
};
export const isAuthenticated = () => {
    return store.getState().identity.isAuthenticated;
};
export const getUser = () => {
    return store.getState().identity.user;
};
export const setAuthenticated = (user) => {
    store.dispatch(setAuthenticatedState(user));
};
export const setUnauthenticated = () => {
    store.dispatch(setUnAuthenticatedState());
};
//#endregion

//#region Route
export const setRoute = (route) => {
    store.dispatch(setCanoePage(route.page, route.riotHash));
};
export const getRoute = () => {
    return store.getState().route;
};
//#endregion

export const subscribeToStore = (subscriptionFunction) => {
    return store.subscribe(subscriptionFunction);
};