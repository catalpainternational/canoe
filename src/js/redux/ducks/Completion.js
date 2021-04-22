// ACTIONS
const COMPLETIONS_SET_COMPLETION = "completion/setComplete";
const COMPLETIONS_SET_MANY_COMPLETIONS = "completion/setCompletions";
const COMPLETIONS_CLEAR = "completion/clear";

// ACTION CREATORS
export const setCompletionAction = (pageId, time, complete) => ({
    type: COMPLETIONS_SET_COMPLETION,
    pageId,
    time,
    complete
});
export const setManyCompletionsAction = (completions) => ({
    type: COMPLETIONS_SET_MANY_COMPLETIONS,
    completions: completions.sort((a, b) => a.time > b.time),
});
export const clearCompletionsAction = () => ({
    type: COMPLETIONS_CLEAR,
});

const INITIAL_STATE = null;

// REDUCER
const completionsReducer = (state = INITIAL_STATE, action) => {
    const newState = {};
    switch (action.type) {
        case COMPLETIONS_CLEAR:
            return newState;
        case COMPLETIONS_SET_COMPLETION:
            Object.assign(newState, state);
            if (action.complete) {
                newState[action.pageId] = action.time;
            } else if( newState[action.pageId]) {
                delete newState[action.pageId];
            }
            return newState;
        case COMPLETIONS_SET_MANY_COMPLETIONS:
            Object.assign(newState, state);
            action.completions.forEach(completion => {
                if (completion.complete) {
                    newState[completion.pageId] = completion.time;
                } else if( newState[completion.pageId]) {
                    delete newState[completion.pageId];
                }
            });
            return newState;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    completions: completionsReducer
};
