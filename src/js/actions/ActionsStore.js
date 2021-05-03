/* Action Store
 * Coordinates the storing of actions
 * depends on actions_idb, and actions_api and syncronises state between the local store and the server
 */

import {
    writeAction as writeIdbAction,
    readActions as readIDBActions,
    markActionAsSynced,
    ensureAction,
    unsyncedActions,
} from "./actions_idb";
import { postAction, getActions } from "./actions_api";
import { make_uuid32 } from "./make_uuid32";
import { isAuthenticated } from "ReduxImpl/Interface";
import Logger from "../../ts/Logger"

const logger = new Logger("Actions Store");

const EXAM_ACTION_TYPE = "exam";

export const COMPLETION_ACTION_TYPE = "completion";
export const EXAM_ANSWER_TYPE = `${EXAM_ACTION_TYPE}.answer`;
export const EXAM_SCORE_TYPE = `${EXAM_ACTION_TYPE}.finalScore`;

/**
 * Saves an action in the persistent local store
 * If authenticated, posts to the API to persist on the server
 * @param {*} actionType 
 * @param {*} data 
 * @returnsa the data stored in idb 
 */
export const saveAndPostAction = (actionType, data) => {
    const action = {
        type: actionType,
        date: new Date().valueOf(),
        uuid: make_uuid32(),
        ...data,
    };

    // asnchronous persist
    writeIdbAction(action).catch(err => logger.error);

    // asynchronous post
    if (isAuthenticated()) {
        postAction(action).then(isActionSynched => {
            if (isActionSynched) {
                markActionAsSynced(action);
            }
        }).catch(err => logger.error);
    }

    // synchronous return of stored action
    return action;
};

/**
* Returns all actions of a specific type
*/
export const readActions = (type) => {
    return readIDBActions(type);
}

/**
* If authenticated sends all local actions to server API
*/
export function updateApi() {
    if (!isAuthenticated()) {
        // don't continue to post the action if we are not logged in!
        return;
    }
    // send any unsynced actions to the server
    unsyncedActions()
        .then((actions) => {
            return Promise.all(
                actions.map((action) => {
                    // post to api
                    return postAction(action).then((synced) => {
                        // if sync failed return false
                        if (!synced) return false;
                        markActionAsSynced(action);
                        return true;
                    });
                })
            );
        })
        .then((results) => {
            if (results.length) {
                const succesful = results.filter((r) => r);
                logger.info(
                    `${results.length} unsynced items found - ${succesful.length} successfuly synced`
                );
            }
        });
}

/**
* If authenticated gets all server actions and applies them to IDB
*/
export async function updateIdb() {
    if (!isAuthenticated()) {
        // don't continue to post the action if we are not logged in!
        return;
    }
    
    // get server actions and ensure we have them in idb
    const actions = await getActions();
    for (const action of actions) {
        await ensureAction(action);
    }
    if (actions.length) {
        logger.info("Retrieved and applied some server actions");
    }
}
