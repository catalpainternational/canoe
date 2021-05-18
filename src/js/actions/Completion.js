/* Completion module
 * The access point for interface components to set and query completion
 * All interface methods should be synchronous.
 * Depends on the action_store module to persist information
 */

import { storePageCompletions, clearStoredCompletions } from "js/redux/Interface";
import { saveAndPostAction, readActions, COMPLETION_ACTION_TYPE } from "./ActionsStore";
import Logger from "../../ts/Logger";

const logger = new Logger("Completions");

/**
 * Clear the in memory store of completions - for use on logout
 */
export const clearStateCompletions = () => {
    clearStoredCompletions();
};

/**
 * Read completions from store and update redux state
 */
export async function readCompletionsIntoState() {
    let actions;
    try {
        actions = await readActions(COMPLETION_ACTION_TYPE);
    } catch (e) {
        logger.warn("Error in reading completions from store %o", e);
    }
    const actionsToStore = actions.filter((a) => a.pageId);
    if (actionsToStore.length) {
        storePageCompletions(actionsToStore.map(a => {
            return {
                pageId: a.pageId,
                time: a.date,
                complete: a.complete,
            };
        }));
    }
}

/**
 * Store a page completion, persist locally, and send to api
 * @param {*} pageId - the id of the page being marked as complete
 * @param {*} extraDataObject - any extra data to persist with the completion
 * @returns the action stored
 */
export function persistCompletion(pageId, extraDataObject = {}) {
    // store the action ( via idb and api )
    return saveAndPostAction(COMPLETION_ACTION_TYPE, { pageId, ...extraDataObject });
}
