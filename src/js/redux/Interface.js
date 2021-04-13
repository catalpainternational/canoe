import { store, LANGUAGE_STORAGE_KEY } from "./Store";

import { changeLanguage as changeLanguageAction } from "./ducks/i18n";
import { addManifestAction, addPageAction } from "./ducks/Site";
import { changeServiceWorkerState as serviceWorkerStateAction } from "./ducks/ServiceWorker";
import { toggleGuestBanner as toggleGuestBannerAction } from "./ducks/GuestBanner";
import { signalBrowserSupport as signalBrowserSupportAction } from "./ducks/BrowserSupport";
import { clearCompletionsAction, completionsReadyAction, completionAction, bumpCompletionsVersionAction } from "./ducks/Completion";
import { clearExamScoresAction, storeExamScoreAction, storeExamAnswerAction, bumpExamVersionAction, clearPageAnswersAction } from "./ducks/Exam";
import { changeOnlineAction } from "./ducks/Online";
import {
    setAuthenticatedState,
    setUnAuthenticatedState,
} from "./ducks/Identity";
import { setCanoePage } from "./ducks/Route";

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

export const completionsReady = () => {
    store.dispatch(completionsReadyAction(true));
};
export const clearStoredCompletions = () => {
    store.dispatch(clearCompletionsAction());
};
export const storePageComplete = (pageId, time, bump=true) => {
    store.dispatch(completionAction(pageId, time, bump));
}
export const getStoredPageCompletionDate = (pageId) => {
    const pageIdInt = parseInt(pageId);
    const s = store.getState();
    return s.completion.pageIdCompletions[pageIdInt];
}
export const bumpCompletionsStoreVersion = () => {
    store.dispatch(bumpCompletionsVersionAction());
}
export const getCompletionsStoreVersion = () => {
    return store.getState().completion.version;
}

export const clearExamStore = () => {
    store.dispatch(clearExamScoresAction());
}
export const storeExamScore = (pageId, score, bump=true) => {
    store.dispatch(storeExamScoreAction(pageId, score, bump));
}
export const storeExamAnswer = (examPageId, questionId, answer) => {
    store.dispatch(storeExamAnswerAction(examPageId, questionId, answer));
}
export const bumpExamStoreVersion = () => {
    store.dispatch(bumpExamVersionAction());
}
export const clearPageAnswers = (pageId) => {
    store.dispatch(clearPageAnswersAction(pageId));
} 
export const getExamScoresVersion = () => {
    return store.getState().exams.version;
}
export const getExamScores = (pageId) => {
    return store.getState().exams.scores[pageId] || [];
}
export const getExamAnswer = (examPageId, questionId) => {
    const s = store.getState();
    const answers = s.exams.answers[examPageId] || {};
    return answers[questionId] || undefined;
}
export const getExamAnswers = (examPageId) => {
    const s = store.getState();
    return s.exams.answers[examPageId] || {};
}


export const isOnline = () => {
    return store.getState().online;
};

export const setOnline = () => {
    store.dispatch(changeOnlineAction(true));
};

export const setOffline = () => {
    store.dispatch(changeOnlineAction(false));
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

export const setRoute = (route) => {
    store.dispatch(setCanoePage(route.page, route.riotHash));
};

export const getRoute = () => {
    return store.getState().route;
};

export const subscribeToStore = (subscriptionFunction) => {
    return store.subscribe(subscriptionFunction);
};