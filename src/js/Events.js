// Custom events go here (prepend the app name to the event).
const APP_NAME = "canoe";

export const ON_REQUEST_SITE_DOWNLOAD = `${APP_NAME}.app.download`;
export const ON_LOG_IN = `${APP_NAME}.auth.loggedIn`;
export const ON_LOG_OUT = `${APP_NAME}.auth.loggedOut`;
export const ON_ADD_TO_HOME_SCREEN = `${APP_NAME}.sw.addToHomeScreen`;
export const ON_COMPLETION_CHANGE = `${APP_NAME}.completions.change`;
export const ON_ACTION_CHANGE = `${APP_NAME}.actions.change`;
export const ON_PLAY_VIDEO = `${APP_NAME}.videos.clickedPlay`;
export const ON_ANSWERED_TEST_QUESTION = `${APP_NAME}.tests.answeredQuestion`;
export const ON_TOAST_REQUESTED = `${APP_NAME}.toast.requestedAlert`;

export const dispatchSiteDownloadEvent = () => {
    const siteDownloadEvent = new Event(ON_REQUEST_SITE_DOWNLOAD);
    dispatchEvent(siteDownloadEvent);
};

export const dispatchLoggedInEvent = () => {
    const loggedInEvent = new Event(ON_LOG_IN);
    dispatchEvent(loggedInEvent);
};

export const dispatchLoggedOutEvent = () => {
    const loggedOutEvent = new Event(ON_LOG_OUT);
    dispatchEvent(loggedOutEvent);
};

export const dispatchInstallAppEvent = () => {
    const installAppEvent = new Event(ON_ADD_TO_HOME_SCREEN);
    dispatchEvent(installAppEvent);
};

export const dispatchPlayVideoEvent = videoUrl => {
    const playVideoEvent = new CustomEvent(ON_PLAY_VIDEO, { detail: videoUrl });
    dispatchEvent(playVideoEvent);
};

export const dispatchTestAnswerEvent = eventData => {
    const testAnswerEvent = new CustomEvent(ON_ANSWERED_TEST_QUESTION, { detail: eventData });
    dispatchEvent(testAnswerEvent);
};

export const dispatchToastEvent = toastMessage => {
    const toastEvent = new CustomEvent(ON_TOAST_REQUESTED, { detail: toastMessage });
    dispatchEvent(toastEvent);
};
