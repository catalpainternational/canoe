// ACTIONS
const UPDATED_BROWSER_SUPPORT = "browser/supportDecided";

// ACTION CREATOR
export const signalBrowserSupport = (trueOrFalse) => ({
    type: UPDATED_BROWSER_SUPPORT,
    isBrowserSupported: trueOrFalse,
});

// REDUCER
const isBrowserSupported = (state = false, action) => {
    switch (action.type) {
        case UPDATED_BROWSER_SUPPORT:
            return action.isBrowserSupported;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    isBrowserSupported,
};
