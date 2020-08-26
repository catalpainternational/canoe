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

export const pullExamDataIntoMemory = async () => {
    await pullExamAnswersIntoMemory();
    await pullExamScoresIntoMemory();
};

export const clearInMemoryExamData = () => {
    clearInMemoryExamAnswers();
    clearInMemoryExamScores();
};

export default class ExamGrader {
    static saveExamAnswer(questionId, answer) {
        saveAnswer(questionId, answer);
    }

    static loadExamAnswer(questionId) {
        return loadAnswer(questionId);
    }

    static tallyFinalScore(examQuestions) {
        return tallyScore(examQuestions);
    }

    static saveExamScore(courseSlug, finalScore) {
        saveScore(courseSlug, finalScore);
    }
}
