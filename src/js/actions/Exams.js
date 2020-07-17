import { ExamIsMissingAnAnswer } from "js/Errors";

const answers = new Map();

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

export const saveExamAnswer = (questionId, answer) => {
    assertAnswerShape(answer);
    answers.set(questionId, answer);
};

export const loadExamAnswer = (questionId) => {
    const answer = answers.get(questionId);
    if (answer) {
        assertAnswerShape(answer);
    }
    return answer;
};

export const tallyExamScore = (questionIds) => {
    const examAnswers = questionIds.map((questionId) => {
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
