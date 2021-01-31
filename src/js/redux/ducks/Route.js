// ACTIONS
const SET_ROUTE = "route/set";

// ACTION CREATORS
export const setCanoePage = (page, riotHash) => ({ type: SET_ROUTE, page, riotHash });

// REDUCER
const route = (state = {page:{type:"initial"}}, action) => {
    switch (action.type) {
        case SET_ROUTE:
            return {
                page: action.page,
                riotHash: action.riotHash
            };
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default { route };
