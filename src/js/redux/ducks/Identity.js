// ACTIONS
const AUTHENTICATED = "identity/setAuthed";
const UNAUTHENTICATED = "identity/setUnAuthed";

// ACTION CREATORS
export const setAuthenticatedState = (user) => ({ type: AUTHENTICATED, user: user });
export const setUnAuthenticatedState = () => ({ type: UNAUTHENTICATED});

// REDUCER
const identity = (state = "", action) => {
    switch (action.type) {
        case AUTHENTICATED:
            return {isAuthenticated: true, user: action.user};
        case UNAUTHENTICATED:
            return {isAuthenticated: false, user: undefined};
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default { identity };
