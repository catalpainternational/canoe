/* Action Store
 * Coordinates the storing of actions
 * depends on actions_idb, and actions_api and syncronises state between the local store and the server
 */

import {
    writeAction,
    readActions,
    markActionAsSynced,
    ensureAction,
    unsyncedActions,
} from "./actions_idb";
import { postAction, getActions } from "./actions_api";
import { make_uuid32 } from "./make_uuid32";
import { ON_ACTION_CHANGE } from "../Events";

const COMPLETION_ACTION_TYPE = "completion";
const EXAM_ACTION_TYPE = "exam";

const storeAction = async (actionType, data) => {
    const action = {
        type: actionType,
        date: new Date(),
        uuid: make_uuid32(),
        ...data,
    };

    try {
        await writeAction(action);
    } catch (err) {
        console.error(err);
    }

    try {
        const isActionSynched = await postAction(action);
        // if response is ok set the record to known in idb
        if (isActionSynched) {
            markActionAsSynced(action);
        }
    } catch (err) {
        console.error(err);
    }
};

export const storeExamAnswerInIDB = (data) => {
    storeAction(EXAM_ACTION_TYPE, data).then(() => console.log(`stored: ${JSON.stringify(data)}`));
};

export const getExamAnswersFromIdb = () => {
    return readActions(EXAM_ACTION_TYPE);
};

export function storeCompletion(data) {
    storeAction(COMPLETION_ACTION_TYPE, data);
}

export function getCompletions() {
    // deliver from idb
    return readActions(COMPLETION_ACTION_TYPE);
}

export function updateApi() {
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
                console.info(
                    `${results.length} unsynced items found - ${succesful.length} successfuly synced`
                );
            }
        });
}

export async function updateIdb() {
    // get server actions and ensure we have them in idb
    const actions = await getActions();
    for (const action of actions) {
        await ensureAction(action);
        window.dispatchEvent(new CustomEvent(ON_ACTION_CHANGE));
        console.info("Retrieved and applied some server actions");
    }
}
