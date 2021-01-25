// ACTIONS
const CHANGED_AUTHENTICATED_STATUS = "identity/authStatusChange";

// ACTION CREATORS
export const changeAuthenticated = (isAuthenticated) => ({ type: CHANGED_AUTHENTICATED_STATUS, isAuthenticated });

// REDUCER
const identity = (state = "", action) => {
    switch (action.type) {
        case CHANGED_AUTHENTICATED_STATUS:
            return Object.assign({}, state, {isAuthenticated: action.isAuthenticated});
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default { identity };
