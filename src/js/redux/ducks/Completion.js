// ACTIONS
const COMPLETIONS_SET_COMPLETION = "completion/setComplete";
const COMPLETIONS_CLEAR = "completion/clear";
const COMPLETIONS_READY = "completion/ready";
const COMPLETIONS_BUMP = "completion/bump";

// ACTION CREATORS
export const completionsReadyAction = () => ({
    type: COMPLETIONS_READY,
});
export const completionAction = (pageId, time, bump) => ({
    type: COMPLETIONS_SET_COMPLETION,
    pageId,
    time,
    bump
});
export const clearCompletionsAction = () => ({
    type: COMPLETIONS_CLEAR,
});
export const bumpCompletionsVersionAction = () => ({
    type: COMPLETIONS_BUMP,
})

const INITIAL_STATE = {ready: false, pageIdCompletions: {}, version: 0};

// REDUCER
const completionsReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case COMPLETIONS_READY:
            return Object.assign({}, state, {ready: true});
        case COMPLETIONS_CLEAR:
            return Object.assign({}, state, {pageIdCompletions: {}});
        case COMPLETIONS_BUMP:
            return Object.assign({}, state, {version: state.version + 1});
        case COMPLETIONS_SET_COMPLETION:
            const newCompletions = Object.assign(state.pageIdCompletions);
            newCompletions[action.pageId] = action.time;
            return Object.assign({}, state, {
                pageIdCompletions: newCompletions,
                version: action.bump ? state.version +1 : state.version
            });
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    completion: completionsReducer
};
