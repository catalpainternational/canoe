/**
 * User Actions is the place for initialiing the things the user does that we want to persist offline
 * and send and retireve from the server when available
 */
import { readCompletionsIntoState, clearStateCompletions } from "js/actions/Completion";
import { readExamDataIntoState, clearStateExamData } from "js/actions/ExamScores";
import { updateApi, updateIdb, saveAndPostAction } from "js/actions/ActionsStore";
import { closeAndDeleteDB } from "js/actions/actions_idb";
import { isAuthenticated, subscribeToStore } from "ReduxImpl/Interface";

const EVERY_FIVE_MINUTES = 1000 * 60 * 5;
let userActionPoller = null;
let currentAuthenticatedState = false;

const ACTION_TYPES= {
    FEEDBACK: "feedback",
};
/**
 * Main initialisation entry point, performs actions on a fresh reload of the app
 * starts 5 minute poll to submit any unsynched user actions
 * sets up subscription to restart that polling if the user logs in
 */
export function initialiseUserActions() {
    currentAuthenticatedState = isAuthenticated();
    return readFromStoreAndStartPolling()
        .then(() => {
            subscribeToStore(storeListener);
        });
}

/**
 * pulls any data from the api into idb
 * reads that data to pupoulate in memory redxu app state
 * starts polling to submit new actions that might not have synced immediately
 */
function readFromStoreAndStartPolling() {
    return updateIdb()
        .then(readCompletionsIntoState)
        .then(readExamDataIntoState)
        .then(() => {
            startUpdateApiPolling();
        });
}

/**
 * React to login and out state changes
 */
function storeListener() {
    const newAuthenticationState = isAuthenticated();
    if (newAuthenticationState !== currentAuthenticatedState) {
        currentAuthenticatedState = newAuthenticationState;
        if (newAuthenticationState) {
            readFromStoreAndStartPolling();
        } else {
            clearAppData();
        }
    }
}

/**
 * Start the app preiodically sending unsynced data to the api
 */
async function startUpdateApiPolling() {
    if (isAuthenticated()) {
        userActionPoller = window.setInterval(updateApi, EVERY_FIVE_MINUTES);
    }
}

/**
 * Stops the user action periodic poll, clears in memory and idb state
 */
async function clearAppData() {
    if (userActionPoller) window.clearInterval(userActionPoller);
    clearStateCompletions();
    clearStateExamData();
    await closeAndDeleteDB();
}

/**
 * Store page feedback, persist locally, and send to api
 * @param {*} pageId - the id of the page
 * @param {*} extraDataObject - any extra data to persist with the feedback
 * @returns the action stored
 */
export function persistFeedback(extraDataObject = {}) {
    // store the action ( via idb and api )
    return saveAndPostAction(ACTION_TYPES.FEEDBACK, extraDataObject);
}