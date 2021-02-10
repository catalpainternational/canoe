import { Page } from "ts/Implementations/Page";
import CoursePage from "ts/Implementations/Specific/CoursePage";

import { setComplete, isComplete } from "js/actions/completion";

export default class LessonPage extends Page {
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
    get course(): CoursePage {
        return this.parent as CoursePage;
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
