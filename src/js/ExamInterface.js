/*
    ExamInterface inverts the dependency between Canoe and Actions/exam.
*/

import {
    saveExamAnswer as saveAnswer,
    loadExamAnswer as loadAnswer,
    tallyExamScore as tallyScore,
    saveExamScore as saveScore,
    pullExamAnswersIntoMemory,
    pullExamScoresIntoMemory,
    clearInMemoryExamAnswers,
    clearInMemoryExamScores,
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

export const pullExamDataIntoMemory = async () => {
    await pullExamAnswersIntoMemory();
    await pullExamScoresIntoMemory();
};

export const clearInMemoryExamData = () => {
    clearInMemoryExamAnswers();
    clearInMemoryExamScores();
};
