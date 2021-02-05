// ACTIONS
const ADDED_MANIFEST = "site/addedManifest";
const ADD_WAGTAIL_PAGE = "site/addedPage";
const FETCHING_MANIFEST = "site/fetchingManifest";

// ACTION CREATORS
export const addManifestAction = (manifest) => ({ type: ADDED_MANIFEST, manifest });
export const addPageAction = (pageId, pageData) => ({ type: ADD_WAGTAIL_PAGE, pageId, pageData });
export const fetchingManifestAction = (fetching) => ({ type: FETCHING_MANIFEST, fetching: fetching });

// REDUCERS
const manifest = (state = {}, action) => {
    switch (action.type) {
        case ADDED_MANIFEST:
            return action.manifest;
        default:
            return state;
    }
};

const pages = (state = {}, action) => {
    switch (action.type) {
        case ADD_WAGTAIL_PAGE:
            const nextState = Object.assign({}, state);
            nextState[action.pageId] = action.pageData;
            return nextState;
        default:
            return state;
    }
};

const initialFetchStatus = {
    fetchingManifest: false,
}
const fetchStatus = (state = initialFetchStatus, action) => {
    switch (action.type) {
        case FETCHING_MANIFEST:
            const newState = Object.assign(state, {fetchingManifest: action.fetching});
            return newState;
        default:
            return state;
    }
}

// EXPORTED REDUCER
export default {
    fetchStatus,
    manifest,
    pages,
};
