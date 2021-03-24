import { Page } from "../Page";
import {
    getLatestCompletionInCourse,
    getFinishedLessonSlugs,
} from "js/actions/completion";
import {
    getExamHighScore as getHighScore,
    hasUserTriedExam as hasTriedExam,
} from "js/actions/exam";
import ExamGrader from "js/ExamGrader";

export default class Course extends Page {
    get lessons(): any {
        return this.childPages;
    }
    get hasExam(): boolean {
        return this.data.data?.has_exam;
    }
    get examCards(): any[] {
        const examCards = this.data.exam.map((card: any) => {
            const { id, type, value } = card;
            const { question, answers } = value;
            return { id, type, question, answers };
        });
        return examCards;
    }
    get hasUserTriedExam(): boolean {
        return hasTriedExam(this.slug);
    }
    get examHighScore(): number {
        return getHighScore(this.slug);
    }
    get isExamFinished(): boolean {
        return ExamGrader.isExamFinished(this.slug);
    }

    get numberOfFinishedLessons(): number {
        const lessonSlugs = this.lessons.map((lesson: any) => lesson.slug);
        if (this.hasExam) {
            lessonSlugs.push("exam");
        }
        return getFinishedLessonSlugs(this.slug, lessonSlugs).length;
    }
    get numberOfLessons(): number {
        return this.lessons.length;
    }
    get isComplete(): boolean {
        return (
            !!this.numberOfLessons &&
            this.numberOfFinishedLessons === this.numberOfLessons
        );
    }

    get latestCompletion(): any {
        return getLatestCompletionInCourse(
            this.slug,
            this.childPages.map((c) => c.slug)
        );
    }

    get progressStatus(): CourseProgressStatus {
        if (this.numberOfFinishedLessons === 0) {
            return "not-started";
        } else if (this.numberOfFinishedLessons < this.numberOfLessons) {
            return "in-progress";
        } else {
            return "complete";
        }
    }
}

type CourseProgressStatus = "not-started" | "in-progress" | "complete";