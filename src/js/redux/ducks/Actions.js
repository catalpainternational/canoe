// ACTIONS
const COMPLETIONS_ARE_READY = "actions/completionsAreReady";

// ACTION CREATOR
export const signalCompletionsAreReady = (areReady) => ({
    type: COMPLETIONS_ARE_READY,
    areCompletionsReady: areReady,
});

// REDUCER
const areCompletionsReady = (state = false, action) => {
    switch (action.type) {
        case COMPLETIONS_ARE_READY:
            return action.areCompletionsReady;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    areCompletionsReady,
};
