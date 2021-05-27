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
