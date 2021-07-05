// ACTIONS
const SET_PREVIEW = "wagtailPreview/set";

// ACTION CREATORS
export const setPreviewAction = (pageId) => ({ type: SET_PREVIEW, pageId });

// REDUCER
const previewing = (state = null, action) => {
    switch (action.type) {
        case SET_PREVIEW:
            return action.pageId;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default { previewing };
