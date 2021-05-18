// ACTIONS
const SET_ROUTE = "route/set";

// ACTION CREATORS
export const setCanoePage = (page, riotHash) => ({ type: SET_ROUTE, page, riotHash });

const INITIAL_STATE = {page: {type: "initial"}, riotHash: []};
// REDUCER
const route = (state = INITIAL_STATE, action) => {
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
