import { getExamAnswers } from "ReduxImpl/Interface";
import { Page } from "../Page";
import Course from "./Course";

export default class Lesson extends Page {
    get course(): Course {
        return this.parent as Course;
    }
    get shortDescription(): string {
        return this.storedData?.description;
    }
    get longDescription(): string {
        return this.storedData?.long_description;
    }
    get cards(): any {
        return this.storedData?.cards;
    }

    /**
     * a lesson needs its course to be ready
     */
    get ready(): boolean {
        return super.ready && this.course.ready;
    }
    /**
     * Prepare both this page and the parent course
     */
    async prepare(): Promise<void> {
        await super.prepare();
        return this.course.prepare();
    }

    /**  We store the responses to any test cards with its compeltion */
    get completionData(): Record<string, any> {
        const answers = getExamAnswers(this.id);
        return Object.assign(super.completionData, { answers });
    }

    get complete(): boolean {
        return super.complete;
    }
    set complete(complete: boolean) {
        super.complete = complete;
        // if this is the only course in the lesson, and the course has no exam
        // also set the course to complete
        if (
            complete &&
            !this.course.hasExam &&
            this.course.childPages.length == 1
        ) {
            this.course.complete = true;
        }
        // if setting the lesson incomplete, also set the course as incomplete
        if (!complete) {
            this.course.complete = false;
        }
    }
}
