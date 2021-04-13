import {
    completionsReady,
} from "ReduxImpl/Interface";
import { readCompletionsIntoState, clearStateCompletions } from "js/actions/Completion";
import { readExamDataIntoState, clearStateExamData } from "js/actions/exam";
import { updateApi, updateIdb } from "js/actions/actions_store";
import { closeAndDeleteDB } from "js/actions/actions_idb";
import { isAuthenticated, subscribeToStore } from "ReduxImpl/Interface";

const EVERY_FIVE_MINUTES = 1000 * 60 * 5;

let completionPoller = null;
let currentAuthenticatedState = false;

export function initialiseCompletions() {
    currentAuthenticatedState = isAuthenticated();
    readFromStoreAndStartPolling()
        .then(() => {
            subscribeToStore(storeListener);
        });
}

function readFromStoreAndStartPolling() {
    return updateIdb()
        .then(readCompletionsIntoState)
        .then(readExamDataIntoState)
        .then(() => {
            completionsReady();
            startUpdateApiPolling();
        });
}

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

async function startUpdateApiPolling() {
    if (isAuthenticated()) {
        completionPoller = window.setInterval(updateApi, EVERY_FIVE_MINUTES);
    }
}

async function clearAppData() {
    window.clearInterval(completionPoller);
    clearStateCompletions();
    clearStateExamData();
    await closeAndDeleteDB();
}