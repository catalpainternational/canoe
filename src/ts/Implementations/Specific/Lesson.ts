import { Page } from "../Page";
import Course from "./Course";

import { setComplete, isComplete } from "js/actions/completion";

export default class Lesson extends Page {
    isFinished(): boolean {
        return isComplete(this.course.slug, this.slug, undefined);
    }
    isComingSoon(): boolean {
        return this.data.data?.coming_soon;
    }
    completeSection(section: string): any {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setComplete(this.parent!.slug, this.slug, section);
    }
    get course(): Course {
        return this.parent as Course;
    }

    get shortDescription(): string {
        return this.data.data?.description;
    }
    get longDescription(): string {
        return this.data.data?.long_description;
    }
    get objective(): any {
        return this.data.objective;
    }
    get content(): any {
        return this.data.content;
    }
    get test(): any {
        return this.data.test;
    }
    isModuleComplete(module: string): boolean {
        // Not implemented
        return isComplete(this.course.slug, this.slug, module);
    }
}
