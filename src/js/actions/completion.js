/* Completion module
 * The access point for interface components to set and query completion
 * All interface methods should be synchronous.
 * Depends on the action_store module to persist information
 */

import { storePageComplete, bumpCompletionsStoreVersion } from "js/redux/Interface";
import { saveAndPostAction, readActions, COMPLETION_ACTION_TYPE } from "./ActionsStore";
import Logger from "../../ts/Logger";

const logger = new Logger("Completions");

/**
 * Clear the in memory store of completions - for use on logout
 */
export const clearStateCompletions = () => {
    clearCompletions();
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
    actionsToStore.forEach((action) => {
        // update completions without causing a riot update
        storePageComplete(action.pageId, action.date, false);
    });
    if (actionsToStore.length) {
        // cause riot to update
        bumpCompletionsStoreVersion();
    }
}

/**
 * Store a page completion, persist locally, and send to api
 * @param {*} pageId - the id of the page being marked as complete
 * @param {*} extraDataObject - any extra data to persist with the completion
 */
export function persistCompletion(pageId, extraDataObject = {}) {
    const extraData = Object.assign(extraDataObject, {date: new Date()});
    logger.info("setting page %s to complete", pageId);

    // save in redux in memory state
    storePageComplete(pageId, extraData.date);

    // store the action ( via idb and api )
    saveAndPostAction(COMPLETION_ACTION_TYPE, { pageId, ...extraData });
}
