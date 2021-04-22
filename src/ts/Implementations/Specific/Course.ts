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

// class Comment {
// TODO
//     post_repl(commentData: any) {
//         // fetch()
//     }
// }
//
class Discussion {
    // TODO
    // #comments: Array<Comment> = [];
    // get lesson_title(): string {
    //     return "title";
    // }
    // get question(): string {
    //     return "question";
    // }
    // get comments(): Comment {
    //     return this.#comments;
    // }
    //
    // post_comment(commentData: any) {
    //     this.#comments.push(new Comment());
    // }
}

export default class Course extends Page {
    get discussions(): Discussion[] {
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
        return this.data.data?.has_exam;
    }
    get examCards(): any[] {
        const examCards = this.data.exam_cards.map((card: any) => {
            const type = card.tag;
            const { id, question, answers, tag, image } = card;
            return { id, type, question, answers, tag, image };
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
