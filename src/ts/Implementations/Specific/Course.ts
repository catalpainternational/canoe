import { Page } from "../Page";
import {
    getExamScores,
    getExamAnswer,
    getExamAnswers,
    storeExamAnswer,
} from "ReduxImpl/Interface";
import { persistExamScore } from "js/actions/exam";

const EXAM_PASS_SCORE = 75;

export default class Course extends Page {
    get lessons(): any {
        return this.childPages;
    }
    get hasExam(): boolean {
        return this.examCards && !!this.examCards.length;
    }
    get examType(): string {
        return this.storedData.exam_type;
    }
    get examLink(): string {
        const startOrCode =
            this.examCards && this.examType === "prelearning" ? 1 : "code";
        return `${this.loc_hash}:exam:${startOrCode}`;
    }
    get examCards(): any[] {
        const examCards = this.storedData.exam_cards.map((card: any) => {
            const type = card.tag;
            const { id, question, answers, tag, image } = card;
            return { id, type, question, answers, tag, image };
        });
        return examCards;
    }
    get hasUserTriedExam(): boolean {
        return !!getExamScores(this.id).length;
    }
    get examHighScore(): number | undefined {
        let highScore: number | undefined;
        getExamScores(this.id).forEach((score) => {
            if (!highScore || (score.score && score.score > highScore)) {
                highScore = score.score;
            }
        });
        return highScore;
    }
    /** read from state to check if exam passed */
    get examResult(): Record<string, any> {
        const numberOfQuestions = this.examCards.length;
        const answers = getExamAnswers(this.id);
        if (numberOfQuestions != Object.keys(answers).length) {
            return {
                error: "incomplete",
            };
        }
        const correctAnswers = Object.values(answers).filter((a) => a.correct)
            .length;
        const score = correctAnswers / numberOfQuestions;
        return {
            passed: score > EXAM_PASS_SCORE,
            score,
            answers,
        };
    }
    get isExamFinished(): boolean {
        let finished = false;
        getExamScores(this.id).forEach((score) => {
            if (score.score > EXAM_PASS_SCORE) {
                finished = true;
            }
        });
        return finished;
    }

    /**  If the course has ans exam we store
     *     the child lessons in this course at the time
     *     any exam responses with its completion */
    get completionData(): Record<string, any> {
        const courseData: Record<string, any> = {
            lessons: this.childPages.map((l) => {
                return {
                    id: l.id,
                    title: l.title,
                };
            }),
        };
        if (this.hasExam) {
            courseData.exam = this.examResult;
        }
        return Object.assign(super.completionData, courseData);
    }

    get numberOfFinishedLessons(): number {
        let numComplete = this.childPages.filter((l) => l.complete).length;
        if (this.hasExam && this.isExamFinished) {
            numComplete += 1;
        }
        return numComplete;
    }
    get numberOfLessons(): number {
        return this.lessons.length;
    }

    get latestCompletion(): Date | undefined {
        let latest: Date | undefined = undefined;
        this.childPages.forEach((c) => {
            const complete = c.completeDate;
            if (complete && latest && complete > latest) {
                latest = complete;
            }
        });
        return latest;
    }

    saveExamAnswer(
        questionId: string | number,
        answer: Record<string, any>
    ): void {
        storeExamAnswer(this.id, questionId, answer);
    }

    saveExamScore(score: number): void {
        persistExamScore(this.id, score, {});
    }

    examQuestionAnswer(questionId: string | number): any {
        return getExamAnswer(this.id, questionId);
    }

    finalExamScore(): number {
        const answers = getExamAnswers(this.id);
        const correctAnswers = answers.filter((answer) => answer.isCorrect);
        const numberCorrect = correctAnswers.length;
        const numberOfQuestions = answers.length;
        return (numberCorrect / numberOfQuestions) * 100;
    }

    get minumumExamScore(): number {
        return EXAM_PASS_SCORE;
    }
}
