// ACTIONS
const USER_LOGGED_IN = "authentication/userLoggedIn";

// ACTION CREATOR
export const signalUserLoggedIn = (trueOrFalse) => ({
    type: USER_LOGGED_IN,
    userLoggedIn: trueOrFalse,
});

// REDUCER
const userLoggedIn = (state = null, action) => {
    switch (action.type) {
        case USER_LOGGED_IN:
            return action.userLoggedIn;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    userLoggedIn,
};
