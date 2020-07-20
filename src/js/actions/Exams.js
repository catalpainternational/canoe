import { ExamIsMissingAnAnswer } from "js/Errors";
import { storeExamAnswerInIDB, getExamAnswersFromIdb } from "Actions/actions_store";

const answers = new Map();

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

const storeExamAnswerInMemory = (questionId, answer) => {
    answers.set(questionId, answer);
};

export const clearInMemoryExamAnswers = () => {
    answers.clear();
};

export const pullExamAnswersIntoMemory = async () => {
    try {
        const idbAnswers = await getExamAnswersFromIdb();
        for (const idbAnswer of idbAnswers) {
            const { questionId, answers, isCorrect } = idbAnswer;
            storeExamAnswerInMemory(questionId, { answers, isCorrect });
        }
    } catch (err) {
        console.error(`Couldn't load exam response ${questionid}`);
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
