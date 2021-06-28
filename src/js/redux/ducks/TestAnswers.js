// ACTIONS
const TEST_ANSWERS_CLEAR = "exam/clear";
const TEST_ANSWERS_CLEAR_PAGE = "exam/clearPage";
const TEST_ANSWERS_STORE_ANSWER = "exam/storeAnswer";
const FORMATIVE_ASSESSMENTS_STORE_RESULTS = "exam/storeTallies";

// ACTION CREATORS
export const clearTestAnswersAction = () => ({
    type: TEST_ANSWERS_CLEAR,
});
export const clearPageAnswersAction = (pageId) => ({
    type: TEST_ANSWERS_CLEAR_PAGE,
    pageId
});
export const storeTestAnswerAction = (pageId, questionId, answerData) => ({
    type: TEST_ANSWERS_STORE_ANSWER,
    pageId,
    questionId,
    answerData,
});

export const storeAssessmentResultsAction = (pageId, resultData) => ({
    type: FORMATIVE_ASSESSMENTS_STORE_RESULTS,
    pageId,
    resultData,
})

const INITIAL_STATE = null;

// REDUCER
const testAnswersReducer = (state = INITIAL_STATE, action) => {
    const newState = {};
    switch (action.type) {
        case TEST_ANSWERS_CLEAR:
            return newState;
        case TEST_ANSWERS_CLEAR_PAGE:
            Object.assign(newState, state);
            if (newState[action.pageId]) {
                delete newState[action.pageId];
            }
            return newState;
        case TEST_ANSWERS_STORE_ANSWER:
            Object.assign(newState, state);
            if(!newState[action.pageId]) newState[action.pageId] = {};
            newState[action.pageId][action.questionId] = action.answerData;
            return newState;
        case FORMATIVE_ASSESSMENTS_STORE_RESULTS:
            Object.assign(newState, state);
            if(!newState[action.pageId]) newState[action.pageId] = {};
            newState[action.pageId] = action.resultData;
            return newState;
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    testAnswers: testAnswersReducer
};
