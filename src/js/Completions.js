import {
    signalCompletionsAreReady,
    signalCompletionsAreNotReady,
} from "ReduxImpl/Interface";
import { pullExamDataIntoMemory, clearInMemoryExamData } from "js/ExamInterface";
import {
    pullCompletionsIntoMemory,
    clearInMemoryCompletions,
} from "js/CompletionInterface";
import { updateApi, updateIdb } from "Actions/actions_store";
import { closeAndDeleteDB } from "Actions/actions_idb";
import { isAuthenticated, subscribeToStore } from "ReduxImpl/Interface";

const EVERY_FIVE_MINUTES = 1000 * 60 * 5;

let completionPoller = null;
let currentAuthenticatedState = false;

export function initialiseCompletions() {
    currentAuthenticatedState = isAuthenticated();

    updateIdb()
        .then(pullCompletionsIntoMemory)
        .then(pullExamDataIntoMemory)
        .then(() => {
            signalCompletionsAreReady();

            if (isAuthenticated()) {
                startUpdateApiPolling();
            }

            subscribeToStore(storeListener);
        });
};

function storeListener() {
    const newAuthenticationState = isAuthenticated();
    if (newAuthenticationState !== currentAuthenticatedState) {
        currentAuthenticatedState = newAuthenticationState;
        if (newAuthenticationState) {
            startUpdateApiPolling();
        } else {
            clearAppData();
        }
    }
}

async function startUpdateApiPolling() {
    completionPoller = window.setInterval(updateApi, EVERY_FIVE_MINUTES);
}

async function clearAppData() {
    window.clearInterval(completionPoller);
    signalCompletionsAreNotReady();
    clearInMemoryCompletions();
    clearInMemoryExamData();
    await closeAndDeleteDB();
}