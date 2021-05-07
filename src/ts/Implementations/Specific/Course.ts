import { Page, ProgressValues } from "../Page";
import {
    getExamScore,
    storeExamScore,
    getTestAnswers,
    clearPageTestAnswers,
} from "ReduxImpl/Interface";
import { persistExamScore } from "js/actions/ExamScores";
import Lesson from "./Lesson";

const EXAM_PASS_SCORE = 0.75;

export default class Course extends Page {
    get discussions(): any {
        return this.storedData?.lessons.map((lesson: any) => ({
            title: lesson.title,
            id: lesson.id,
            discussion: lesson.discussion,
        }));
    }
    get lessons(): any {
        return this.childPages;
    }
    get hasExam(): boolean {
        return this.examCards && !!this.examCards.length;
    }
    get examType(): string {
        return this.storedData.exam_type;
    }
    get examIsPrelearning(): boolean {
        return this.examCards && this.examType === "prelearning";
    }
    get examLink(): string {
        const startOrCode = this.examIsPrelearning ? 1 : "code";
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
        return getExamScore(this.id) !== undefined;
    }
    get examHighScore(): number | undefined {
        return getExamScore(this.id);
    }
    get isExamFinished(): boolean {
        const score = getExamScore(this.id);
        if (this.examIsPrelearning && score !== undefined) {
            return true;
        } else {
            return score !== undefined && score > EXAM_PASS_SCORE;
        }
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
            pageType: "course",
        };
        return Object.assign(super.completionData, courseData);
    }
    get lessonsComplete(): boolean {
        return this.lessons.every((l: Lesson) => l.complete);
    }
    get numberOfLessons(): number {
        return this.lessons.length;
    }

    get latestCompletion(): Date | undefined {
        let latest: Date | undefined = undefined;
        this.childPages.forEach((c) => {
            const complete = c.completeDate;
            if (!latest || (complete && complete > latest)) {
                latest = complete;
            }
        });
        return latest;
    }

    saveExamScore(): Record<string, any> {
        const result = this.examResult;
        if (!result.error) {
            // persist in idb and api (this is asyncronous, but synchronously returns the uuid )
            const examScoreAction = persistExamScore(this.id, result);

            // save in redux in memory state
            storeExamScore(this.id, examScoreAction.score);

            if (result.passed || this.examType === "prelearning") {
                // set this course as complete in the store
                // this will persist in local storage and the server
                this.addCompletionData({
                    examScoreUuid: examScoreAction.uuid,
                });
                this.complete = true;
            }

            // clear the answers from memory so they do not show up next time
            clearPageTestAnswers(this.id);
        }
        return result;
    }
    /** read from state to check if exam passed */
    get examResult(): Record<string, any> {
        const numberOfQuestions = this.examCards.length;
        const answers = getTestAnswers(this.id);
        if (numberOfQuestions != Object.keys(answers).length) {
            return {
                error: "incomplete",
            };
        }
        const correctAnswers = Object.values(answers).filter((a) => a.correct)
            .length;
        const score = correctAnswers / numberOfQuestions;
        const answersAnnotated = this.examCards.map((card) => {
            const answer = answers[card.id];
            return {
                question: card.question,
                answer: answer,
            };
        });
        return {
            passed: score >= EXAM_PASS_SCORE,
            score,
            answers: answersAnnotated,
        };
    }

    get minimumExamScore(): number {
        return Math.ceil(EXAM_PASS_SCORE * 100);
    }

    /** the data to show in a progress bar for a course includes
     * the exam, we need wait for the page to be ready to know if it has an exam
     */
    get progressValues(): ProgressValues {
        const values = super.progressValues;
        if (!this.ready) {
            // kick of an async prepare to get the exam data
            this.prepare();
            // return the progress without exam data
            return values;
        } else {
            values.min += this.isExamFinished ? 1 : 0;
            values.max += this.hasExam ? 1 : 0;
            return values;
        }
    }
}
