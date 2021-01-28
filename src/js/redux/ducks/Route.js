// ACTIONS
const SET_ROUTE = "route/set";

// ACTION CREATORS
export const setCanoePage = (page) => ({ type: SET_ROUTE, route: { page }});

// REDUCER
const route = (state = "", action) => {
    switch (action.type) {
        case SET_ROUTE:
            return action.route;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default { route };
