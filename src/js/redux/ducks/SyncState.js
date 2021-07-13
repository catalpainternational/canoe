// ACTIONS
const UPDATED_SYNCSTATE = "syncState/updated";

// ACTION CREATORS
export const addSyncStateAction = (syncState) => ({ type: UPDATED_SYNCSTATE, syncState });

// REDUCERS
const syncState = (state = {}, action) => {
    switch (action.type) {
        case UPDATED_SYNCSTATE:
            return action.syncState;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    syncState,
};
