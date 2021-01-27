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
    if (currentAuthenticatedState) {
        prepDataForAppLaunch();
    }

    subscribeToStore(storeListener);
};

function storeListener() {
    const newAuthenticationState = isAuthenticated();
    if (newAuthenticationState !== currentAuthenticatedState) {
        if (newAuthenticationState) {
            prepDataForAppLaunch();
        } else {
            clearAppData();
        }
        currentAuthenticatedState = newAuthenticationState;
    }
}

async function prepDataForAppLaunch() {
    await updateIdb();
    completionPoller = window.setInterval(updateApi, EVERY_FIVE_MINUTES);

    await pullCompletionsIntoMemory();
    await pullExamDataIntoMemory();

    signalCompletionsAreReady();
}

async function clearAppData() {
    window.clearInterval(this.state.pagesPoller);
    signalCompletionsAreNotReady();
    clearInMemoryCompletions();
    clearInMemoryExamData();
    await closeAndDeleteDB();
}