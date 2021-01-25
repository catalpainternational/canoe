// ACTIONS
const CHANGED_ONLINE_STATUS = "online/set";

// ACTION CREATORS
export const changeOnlineAction = (isOnline) => ({ type: CHANGED_ONLINE_STATUS, isOnline });

// REDUCER
const online = (state = "", action) => {
    switch (action.type) {
        case CHANGED_ONLINE_STATUS:
            return Boolean(action.isOnline);
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default { online };
