import { Page } from "../Page";
import Course from "./Course";

export default class AllCourses extends Page {
    #all_tags!: Set<string>;

    get all_tags(): Set<string> {
        if (this.#all_tags === undefined) {
            this.#all_tags = new Set(
                this.courses
                    .map((c: any) => c.tags)
                    .flat()
                    .map((tag: string) => tag.toLowerCase())
            );
        }
        return this.#all_tags;
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

    get coursesInProgress(): Course[] {
        return this.courses.filter(
            (course: Course) => course.progressStatus == "not-started"
        );
    }

    get coursesCompleted(): Course[] {
        return this.courses.filter(
            (course: Course) => course.progressStatus == "complete"
        );
    }

    get coursesCompleteLast(): Course[] {
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

    get countFinishedLessonsAndExams(): number {
        const tallyFinishedLessonsAndExams = (
            totalFinished: any,
            aCourse: any
        ) => totalFinished + aCourse.numberOfFinishedLessons;
        return this.courses.reduce(tallyFinishedLessonsAndExams, 0);
    }

    get countLessonsAndExams(): number {
        const tallyLessonsAndExams = (totalLessons: any, currentCourse: any) =>
            totalLessons + currentCourse.numberOfLessons;
        return this.courses.reduce(tallyLessonsAndExams, 0);
    }

    get numberOfLessonsLeft(): number {
        return (
            this.countFinishedLessonsAndExams -
            this.countFinishedLessonsAndExams
        );
    }

    get title(): string {
        return this.data.title;
    }

    get description(): string {
        return this.data.body;
    }
}
