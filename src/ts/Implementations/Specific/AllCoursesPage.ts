import { Page } from "../Page";
import CoursePage from "./CoursePage";
import { getLatestCompletionInCourse } from "js/actions/completion";

export default class AllCoursesPage extends Page {
    #tags!: string[];

    get tags(): string[] {
        if (this.#tags === undefined) {
            this.#tags = this.pageData.courses
                .map((c: any) => c.tags)
                .flat()
                .map((tag: string) => tag.toLowerCase());
        }
        return this.#tags;
    }
    get courses(): any {
        return this.childPages;
    }
    isCourseComplete(course: Record<string, any>): boolean {
        return !!course;
    }
    courseIdHasATagIn(courseId: number, tags: string[]): boolean {
        const course = this.pageData.courses.find(
            (c: any) => c.data.id == courseId
        );
        const courseTags = new Set(course.tags);
        const tagsSet = new Set(tags);
        return (
            [...tagsSet].filter((tag: string) => courseTags.has(tag)).length > 0
        );
    }
    get coursesCompleteLast(): CoursePage[] {
        const inComplete: any[] = [];
        const complete: any[] = [];
        this.courses.forEach((course: any) => {
            if (this.isCourseComplete(course)) {
                complete.push(course);
            } else {
                inComplete.push(course);
            }
        });
        return inComplete.concat(complete);
    }
    get currentCourse(): any {
        return getLatestCompletionInCourse("d", ["D"]);
    }
}
