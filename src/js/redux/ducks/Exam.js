// ACTIONS
const EXAM_CLEAR = "exam/clear";
const EXAM_CLEAR_PAGE = "exam/clearPage";
const EXAM_STORE_SCORE = "exam/storeScore";
const EXAM_STORE_ANSWER = "exam/storeAnswer";
const EXAM_STORE_BUMP = "exam/bump";

// ACTION CREATORS
export const clearExamScoresAction = () => ({
    type: EXAM_CLEAR,
});
export const clearPageAnswersAction = (pageId) => ({
    type: EXAM_CLEAR_PAGE,
    pageId
});
export const storeExamScoreAction = (examPageId, score, bump) => ({
    type: EXAM_STORE_SCORE,
    examPageId,
    score,
    bump
});
export const storeExamAnswerAction = (pageId, questionId, answerData, bump) => ({
    type: EXAM_STORE_ANSWER,
    pageId,
    questionId,
    answerData,
    bump
});
export const bumpExamVersionAction = () =>({
    type: EXAM_STORE_BUMP,
})

const INITIAL_STATE = {ready: false, scores: {}, answers: {}, version: 0};

// REDUCER
const examsReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case EXAM_CLEAR:
            return Object.assign({}, INITIAL_STATE, {ready: true});
        case EXAM_CLEAR_PAGE:
            const pageAnswers2 = Object.assign({}, state.answers);
            if (pageAnswers2[action.pageId]) {
                delete pageAnswers2[action.pageId];
            }
            return Object.assign({}, state, {answers:  pageAnswers2});
        case EXAM_STORE_SCORE:
            const pageScores = state.scores[action.examPageId] || [];
            pageScores.append(score);
            return Object.assign({}, state, {
                scores: pageScores,
                version: action.bump ? state.version +1 : state.version
            });
        case EXAM_STORE_ANSWER:
            const newAnswerData = {
                ...state.answers
            };
            if(!newAnswerData[action.pageId]) newAnswerData[action.pageId] = {};  
            newAnswerData[action.pageId][action.questionId] = action.answerData;
            return Object.assign({}, state, {
                answers: newAnswerData,
                version: action.bump ? state.version +1 : state.version
            });
        case EXAM_STORE_BUMP:
            return Object.assign({}, state, {
                version: state.version + 1,
            });
        default:
            return state;
    }
};

// EXPORTED REDUCER
export default {
    exams: examsReducer
};
