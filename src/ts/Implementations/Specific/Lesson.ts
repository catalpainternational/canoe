import { getTestAnswers } from "ReduxImpl/Interface";
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

    /**  We store the responses to any test cards with its completion */
    get completionData(): Record<string, any> {
        const answers = getTestAnswers(this.id);
        return Object.assign(super.completionData, {
            answers,
            pageType: "lesson",
        });
    }

    get threads(): Array<Thread> {
        return this.storedData?.discussion;
    }
}

class Thread {
    #id: string;
    #question?: string;

    constructor(id: string, question?: string) {
        this.#id = id;
        this.#question = question;
    }
}
