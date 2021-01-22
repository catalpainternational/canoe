// Custom events go here (prepend the app name to the event).
const APP_NAME = "canoe";

export const ON_LOG_IN = `${APP_NAME}.auth.loggedIn`;
export const ON_LOG_OUT = `${APP_NAME}.auth.loggedOut`;
export const ON_ADD_TO_HOME_SCREEN = `${APP_NAME}.sw.addToHomeScreen`;
export const ON_COMPLETION_CHANGE = `${APP_NAME}.completions.change`;
export const ON_ACTION_CHANGE = `${APP_NAME}.actions.change`;
export const ON_ANSWERED_TEST_QUESTION = `${APP_NAME}.tests.answeredQuestion`;

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

export const dispatchTestAnswerEvent = eventData => {
    const testAnswerEvent = new CustomEvent(ON_ANSWERED_TEST_QUESTION, { detail: eventData });
    dispatchEvent(testAnswerEvent);
};