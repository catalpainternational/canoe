// ACTIONS
const ADDED_MANIFEST = "site/addedManifest";
const ADD_WAGTAIL_PAGE = "site/addedPage";

// ACTION CREATORS
export const addManifestAction = (manifest) => ({ type: ADDED_MANIFEST, manifest });
export const addPageAction = (pageId, pageData) => ({ type: ADD_WAGTAIL_PAGE, pageId, pageData });

// REDUCERS
const manifest = (state = null, action) => {
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

// EXPORTED REDUCER
export default {
    manifest,
    pages,
};
