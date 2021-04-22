import { getActions } from "../../actions/actions_api";

// ACTIONS
const EXAM_CLEAR = "exam/clear";
const EXAM_STORE_SCORE = "exam/storeScore";
const EXAM_STORE_MANY_SCORES = "exam/storeManyScores";

// ACTION CREATORS
export const clearExamScoresAction = () => ({
    type: EXAM_CLEAR,
});
export const storeExamScoreAction = (pageId, score) => ({
    type: EXAM_STORE_SCORE,
    pageId,
    score,
});
export const storeExamScoresAction = (scores) => ({
    type: EXAM_STORE_MANY_SCORES,
    scores,
});

const INITIAL_STATE = null;

// REDUCER
const examScoresReducer = (state = INITIAL_STATE, action) => {
    const newState = {};
    switch (action.type) {
        case EXAM_CLEAR:
            return newState;
        case EXAM_STORE_SCORE:
            Object.assign(newState, state);
            const oldScore = (state && state[action.pageId]) || undefined;
            if (!oldScore || action.score > oldScore) {
                newState[action.pageId] = action.score;
            }
            return newState;
        case EXAM_STORE_MANY_SCORES:
            Object.assign(newState, state);
            action.scores.forEach(scoreData => {
                const oldScore = (state && state[scoreData.pageId]) || undefined;
                if (!oldScore || scoreData.score > oldScore) {
                    newState[scoreData.pageId] = scoreData.score;
                }
            });
            return newState;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    examScores: examScoresReducer
};
