import { Page } from "../Page";
import CoursePage from "./CoursePage";

export default class LessonPage extends Page {
    isFinished(): boolean {
        // Not implemented
        return false;
    }
    isComingSoon(): boolean {
        // Not implemented
        return false;
    }
    get course(): CoursePage {
        return this.parent as CoursePage;
    }

    get shortDescription(): string {
        return this.pageData.data?.description;
    }
    get longDescription(): string {
        return this.pageData.data?.long_description;
    }
    get objective(): any {
        return this.pageData.objective;
    }
    get content(): any {
        return this.pageData.content;
    }
    get test(): any {
        return this.pageData.test;
    }
    isModuleComplete(module: string): boolean {
        // Not implemented
        return !module.length;
    }
}
