import { Page } from "../Page";
import { getLatestCompletionInCourse } from "js/actions/completion";

export default class CoursePage extends Page {
    get lessons(): any {
        return this.childPages;
    }
    get tags(): string[] {
        return this.pageData.tags;
    }

    get hasExam(): boolean {
        // NOT IMPLEMENTED
        return true;
    }
    get hasUserTriedExam(): boolean {
        // NOT IMPLEMENTED
        return true;
    }
    get examHighScore(): number {
        // NOT IMPLEMENTED
        return 46;
    }
    get allLessonsComplete(): boolean {
        // NOT IMPLEMENTED
        return true;
    }
    get isExamFinished(): boolean {
        // NOT IMPLEMENTED
        return true;
    }

    get currentCourse(): any {
        return getLatestCompletionInCourse("d", ["D"]);
    }
    get numberOfFinishedLessons(): number {
        return 0;
    }
    get numberOfLessons(): number {
        return 3;
    }
    isComplete(): boolean {
        return true;
    }
}
