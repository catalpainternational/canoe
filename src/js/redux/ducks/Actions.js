// ACTIONS
const USER_ACTIONS_ARE_READY = "userActions/actionsAreReady";
const USER_ACTIONS_ADD = "userActions/actionsAdded";
const USER_ACTIONS_EMPTY = "userActions/actionsEmptied";

// ACTION CREATORS
export const userActionsReadyAction = (ready) => ({
    type: USER_ACTIONS_ARE_READY,
    ready: ready,
});
export const clearUserActionsAction = () => ({
    type: USER_ACTIONS_EMPTY,
});
export const addUserActionsAction = (userActions) => {
    // check we are not adding duplicate uuids
    const usedUuids = {};
    userActions.forEach((a) => {
        if (usedUuids[a.uuid]) {
            throw Error("You may not add duplicate uuid actions");
        } else {
            usedUuids[a.uuid] = true;
        }
    })
    return {
        type: USER_ACTIONS_ADD,
        userActions: userActions,
    }
};

const INITIAL_STATE = {ready: false, userActions: []};

// REDUCER
const userActionsReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case USER_ACTIONS_EMPTY:
            return Object.assign({}, state, {ready: true, userActions: []});
        case USER_ACTIONS_ARE_READY:
            return Object.assign({}, state, {ready: action.ready});
        case USER_ACTIONS_ADD:
            const existing_uuids = state.userActions.map((a) => a.uuid);
            const newActions = state.userActions.slice();
            action.userActions.forEach((a) => {
                if(!existing_uuids.includes(a.uuid)) {
                    newActions.unshift(a);
                }
            }) 
            return Object.assign({}, state, {userActions: newActions});
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    userActionsReducer
};
