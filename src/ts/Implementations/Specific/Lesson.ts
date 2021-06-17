import { getTestAnswers } from "ReduxImpl/Interface";
import { Page } from "../Page";
import Course from "./Course";

export default class Lesson extends Page {
    get course(): Course {
        return this.parent as Course;
    }
    get shortDescription(): string {
        return this.manifestData.data?.description;
    }
    get longDescription(): string {
        return this.manifestData.data?.long_description;
    }
    get cards(): any {
        return this.storedData?.cards;
    }

    /**  We store the responses to any test cards with its completion */
    get completionData(): Record<string, any> {
        const answers = getTestAnswers(this.id);
        return Object.assign(super.completionData, {
            cardData: Object.fromEntries(
                Object.entries(answers).map(([uuid, answer]) => {
                    return [uuid, answer.attempts];
                })
            ),
        });
    }
    get complete(): boolean {
        return super.complete;
    }
    set complete(complete: boolean) {
        super.complete = complete;
        // if the course has no other incomplete lessons, and the course has no exam
        // also set the course to complete
        if (
            complete &&
            !this.course.hasExam &&
            this.course.childPages.filter(
                (c) => c.id !== this.id && !c.complete
            ).length === 0
        ) {
            this.course.complete = true;
        }
        // if setting the lesson incomplete, also set the course as incomplete
        if (!complete) {
            this.course.complete = false;
        }
    }
    get threads(): Array<Thread> {
        return this.storedData?.discussion;
    }
    /** extend the prepare call to make the lesson available offline pre-loading assets used */
    async prepare(): Promise<void> {
        super.prepare();
        this.makeAvailableOffline();
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
