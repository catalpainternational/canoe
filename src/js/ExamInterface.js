/*
    ExamInterface inverts the dependency between Canoe and Actions/exam.
*/

import {
    saveExamAnswer as saveAnswer,
    loadExamAnswer as loadAnswer,
    tallyExamScore as tallyScore,
    saveExamScore as saveScore,
    getExamHighScore as getHighScore,
} from "Actions/exam";

export const saveExamAnswer = (questionId, answer) => {
    saveAnswer(questionId, answer);
};

export const loadExamAnswer = (questionId) => {
    return loadAnswer(questionId);
};

export const tallyFinalScore = (examQuestions) => {
    return tallyScore(examQuestions);
};

export const saveExamScore = (courseSlug, finalScore) => {
    saveScore(courseSlug, finalScore);
};

export const getExamHighScore = (courseSlug) => {
    return getHighScore(courseSlug);
};
