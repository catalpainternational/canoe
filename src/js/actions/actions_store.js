/* Action Store
 * Coordinates the storing of actions
 * depends on actions_idb, and actions_api and syncronises state between the local store and the server
 */

import { writeAction, readActions, markActionAsSynced, ensureAction, unsyncedActions } from './actions_idb';
import { postAction, getActions } from './actions_api';
import { make_uuid32 } from './make_uuid32';
import { ON_ACTION_CHANGE } from '../Events';

export function storeCompletion(data) {
    // create the completion object
    const action = {
        type: 'completion',
        date: new Date(),
        uuid: make_uuid32()
    };
    Object.assign(action, data);

    writeAction(action).catch(err => console.error(err));

    postAction(action).catch(err => console.error(err))
        .then(synced => {
            // if response is ok set the record to known in idb 
            if (synced) {
                markActionAsSynced(action);
            }
        });
}

export function getCompletions() {
    // deliver from idb
    return readActions('completion');
}

export function updateApi() {
    // send any unsynced actions to the server
    unsyncedActions().then(actions => {
        return Promise.all(actions.map(action => {
            // post to api
            return postAction(action).then(synced => {
                // if sync failed return false
                if (!synced) return false;
                markActionAsSynced(action);
                return true;
            });
        }));
    }).then(results => {
        if (results.length) {
            const succesful = results.filter(r => r);
            console.info(`${results.length} unsynced items found - ${succesful.length} successfuly synced`);
        }
    });
}

export async function updateIdb() {
    // get server actions and ensure we have them in idb
    try{
        const actions = await getActions();
        const results = await Promise.all(actions.map(ensureAction));
        if (results.some(v => v)) {
            // let things know that actions have been updated
            window.dispatchEvent(new CustomEvent(ON_ACTION_CHANGE));
            console.info('Retrieved and applied some server actions');
        }
    } catch (e) {
        console.error(e);
    }
}
