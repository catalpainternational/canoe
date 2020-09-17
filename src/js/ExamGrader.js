import {
    saveExamAnswer as saveAnswer,
    loadExamAnswer as loadAnswer,
    tallyExamScore as tallyScore,
    saveExamScore as saveScore,
} from "Actions/exam";
import { setComplete, isComplete } from "Actions/completion";

const EXAM_SLUG = "exam";

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

    static saveExamScore(courseSlug, finalScore, minimumScore) {
        saveScore(courseSlug, finalScore);
        if (finalScore >= minimumScore) {
            setComplete(courseSlug, EXAM_SLUG, EXAM_SLUG, { finalScore });
        }
    }

    static isExamFinished(courseSlug) {
        return isComplete(courseSlug, EXAM_SLUG, EXAM_SLUG);
    }
}
