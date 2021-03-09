/*
    ExamInterface inverts the dependency between Canoe and Actions/exam.
*/

import {
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
