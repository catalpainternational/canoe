/* Action Store
 * Coordinates the storing of actions
 * depends on actions_idb, and actions_api and syncronises state between the local store and the server
 */

import {
    writeAction,
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
export const EXAM_FINAL_SCORE_TYPE = `${EXAM_ACTION_TYPE}.finalScore`;

/* saves an action in the persistent local store
* If authenticated, posts to the API to persist on the server
*/
export const saveAndPostAction = async (actionType, data) => {
    const action = {
        type: actionType,
        date: new Date(),
        uuid: make_uuid32(),
        ...data,
    };

    try {
        await writeAction(action);
    } catch (err) {
        logger.error(err);
    }

    if (!isAuthenticated()) {
        // don't continue to post the action if we are not logged in!
        return;
    }

    try {
        const isActionSynched = await postAction(action);
        // if response is ok set the record to known in idb
        if (isActionSynched) {
            markActionAsSynced(action);
        }
    } catch (err) {
        logger.error(err);
    }
};
/* returns all actions of a specific type from IDB */
export const readActions = (type) => {
    return readIDBActions(type);
}

export const storeIDBExamAnswer = (data) => {
    storeAction(EXAM_ANSWER_TYPE, data);
};

export const getIDBExamAnswers = () => {
    return readActions(EXAM_ANSWER_TYPE);
};

export const storeIDBExamScore = (pageId, finalScore) => {
    storeAction(EXAM_FINAL_SCORE_TYPE, { pageId, finalScore });
};

export const getIDBExamScores = () => {
    return readActions(EXAM_FINAL_SCORE_TYPE);
};

export function storeIDBCompletion(data) {
    storeAction(COMPLETION_ACTION_TYPE, data);
}

/* if authenticated sends all local actions to server API */
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

/* if authenticated gets all server actions and applies them to IDB */
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
