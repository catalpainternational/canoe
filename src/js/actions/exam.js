import { ExamIsMissingAnAnswer } from "js/Errors";
import {
    storeExamAnswerInIDB,
    getExamAnswersFromIdb,
    storeExamScoreInIDB,
    getExamScoresFromIDB,
} from "Actions/actions_store";

const answers = new Map();
const finalScores = new Map();

const isUUID = (uuid) => {
    // Regex doesn't support Nil UUID.
    const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuid.match(regexUUID);
};

const assertQuestionIdShape = (questionId) => {
    console.assert(isUUID(questionId), `The question ID must be a valid UUID: ${questionId}`);
};

const assertAnswerShape = (answer) => {
    /*
        An answer looks like this:
        {
           answers: [an Array: contains the actual answers],
           isCorrect: [a Boolean: was this answer right or wrong?],
        }
    */
    console.assert(
        answer.hasOwnProperty("answers"),
        `The answer object must have an "answers" property: ${JSON.stringify(answer)}`
    );
    console.assert(
        answer.hasOwnProperty("isCorrect"),
        `The answer object must have an "isCorrect" property: ${JSON.stringify(answer)}`
    );
    const { answers, isCorrect } = answer;
    console.assert(Array.isArray(answers), `The "answers" property must be an Array.`);
    console.assert(typeof isCorrect === "boolean", `The "isCorrect" property must be a boolean.`);
};

const assertExamScoreParameters = (courseSlug, finalScore) => {
    console.assert(typeof courseSlug === "string", `The "courseSlug" must be a string.`);
    console.assert(typeof finalScore === "number", `The "finalScore" must be a number.`);
};

const storeExamAnswerInMemory = (questionId, answer) => {
    answers.set(questionId, answer);
};

export const clearInMemoryExamAnswers = () => {
    answers.clear();
};

export const clearInMemoryExamScores = () => {
    finalScores.clear();
};

export const pullExamAnswersIntoMemory = async () => {
    const idbAnswers = await getExamAnswersFromIdb();
    for (const idbAnswer of idbAnswers) {
        const { questionId, answers, isCorrect } = idbAnswer;
        storeExamAnswerInMemory(questionId, { answers, isCorrect });
    }
};

export const saveExamAnswer = (questionId, answer) => {
    assertQuestionIdShape(questionId);
    assertAnswerShape(answer);

    storeExamAnswerInMemory(questionId, answer);
    storeExamAnswerInIDB({ questionId, ...answer });
};

export const loadExamAnswer = (questionId) => {
    assertQuestionIdShape(questionId);

    const answer = answers.get(questionId);
    if (answer) {
        assertAnswerShape(answer);
    }
    return answer;
};

export const saveExamScore = (courseSlug, finalScore) => {
    assertExamScoreParameters(courseSlug, finalScore);

    storeExamScoreInMemory(courseSlug, finalScore);
    storeExamScoreInIDB(courseSlug, finalScore);
};

export const getExamHighScore = (courseSlug) => {
    if (!finalScores.has(courseSlug)) {
        return 0;
    }
    const scores = finalScores.get(courseSlug);
    return Math.max(...scores);
};

export const pullExamScoresIntoMemory = async () => {
    const idbScores = await getExamScoresFromIDB();

    for (const idbScore of idbScores) {
        const { course, finalScore } = idbScore;
        storeExamScoreInMemory(course, finalScore);
    }
};

const storeExamScoreInMemory = (courseSlug, finalScore) => {
    assertExamScoreParameters(courseSlug, finalScore);

    if (!finalScores.has(courseSlug)) {
        finalScores.set(courseSlug, [finalScore]);
    } else {
        const scores = finalScores.get(courseSlug);
        finalScores.set(courseSlug, [...scores, finalScore]);
    }
};

export const tallyExamScore = (questionIds) => {
    const examAnswers = questionIds.map((questionId) => {
        assertQuestionIdShape(questionId);
        const answer = answers.get(questionId);
        if (!answer) {
            throw new ExamIsMissingAnAnswer(
                `The exam question, "${questionId}", is missing an answer.`
            );
        }
        return answer;
    });
    const correctAnswers = examAnswers.filter((answer) => answer.isCorrect);
    const numberCorrect = correctAnswers.length;
    const numberOfQuestions = questionIds.length;
    return (numberCorrect / numberOfQuestions) * 100;
};

export const hasUserTriedExam = (courseSlug) => {
    return finalScores.has(courseSlug);
};
