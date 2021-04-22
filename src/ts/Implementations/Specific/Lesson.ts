import { Page } from "../Page";
import Course from "./Course";

import { setComplete, isComplete } from "js/actions/completion";

export default class Lesson extends Page {
    isFinished(): boolean {
        return isComplete(this.course.slug, this.slug, undefined);
    }
    completeSection(section: string): any {
        setComplete(this.course.slug, this.slug, section);
    }
    get course(): Course {
        return this.parent as Course;
    }

    get shortDescription(): string {
        return this.storedData?.description;
    }
    get longDescription(): string {
        return this.storedData?.long_description;
    }
    get content(): any {
        return this.storedData?.content;
    }
    isModuleComplete(module: string): boolean {
        // Not implemented
        return isComplete(this.course.slug, this.slug, module);
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
