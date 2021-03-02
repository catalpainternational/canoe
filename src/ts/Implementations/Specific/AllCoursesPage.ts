import { Page } from "../Page";
import CoursePage from "./CoursePage";

export default class AllCoursesPage extends Page {
    #tags!: string[];

    get tags(): string[] {
        if (this.#tags === undefined) {
            this.#tags = this.data.courses
                .map((c: any) => c.tags)
                .flat()
                .map((tag: string) => tag.toLowerCase());
        }
        return this.#tags;
    }

    get courses(): any {
        return this.childPages;
    }

    courseIdHasATagIn(courseId: number, tags: string[]): boolean {
        const course = this.data.courses.find(
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
            if (course.isComplete) {
                complete.push(course);
            } else {
                inComplete.push(course);
            }
        });
        return inComplete.concat(complete);
    }

    get currentCourse(): any {
        let lastWorkedOnCourse = null;
        const coursesWithCompletions = this.courses.filter(
            (course: any) => course.latestCompletion
        );

        for (const course of coursesWithCompletions) {
            if (
                lastWorkedOnCourse &&
                !course.isComplete &&
                course.latestCompletion.completionDate <
                    lastWorkedOnCourse.latestCompletion.completionDate
            ) {
                continue;
            }
            lastWorkedOnCourse = course;
        }
        return lastWorkedOnCourse;
    }
}
