// ACTIONS
const AUTHENTICATED = "identity/setAuthed";
const UNAUTHENTICATED = "identity/setUnAuthed";
const SET_USER = "identity/setUser";

// ACTION CREATORS
export const setAuthenticatedState = (user) => ({ type: AUTHENTICATED, user: user });
export const setUnAuthenticatedState = () => ({ type: UNAUTHENTICATED});
export const setUserDetailsState = (user) => ({ type: SET_USER, user:user});

// REDUCER
const identity = (state = "", action) => {
    switch (action.type) {
        case AUTHENTICATED:
            return {isAuthenticated: true, user: action.user};
        case UNAUTHENTICATED:
            return {isAuthenticated: false, user: undefined};
        case SET_USER:
            return Object.assign({}, state, {user: action.user});
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default { identity };
