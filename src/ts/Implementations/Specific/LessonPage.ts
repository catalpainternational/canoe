import { Page } from "ts/Implementations/Page";
import CoursePage from "ts/Implementations/Specific/CoursePage";

export default class LessonPage extends Page {
    isFinished(): boolean {
        // Not implemented
        return false;
    }
    isComingSoon(): boolean {
        // Not implemented
        return false;
    }
    completeSection(section: string): any {
        // Not implemented
        return section;
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
        return !module.length;
    }
}
