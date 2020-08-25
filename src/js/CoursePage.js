import { countCompleteLessonsInCourses, getLatestCompletionInCourse } from "js/CompletionInterface";
import { _getOrFetchWagtailPageById } from "js/WagtailPagesAPI";
import LessonPage from "./LessonPage";

export default class CoursePage {
    constructor(aWagtailCourse) {
        this.course = aWagtailCourse;
        console.log(this.course);
    }

    get json() {
        return this.course;
    }

    get id() {
        return this.course.id;
    }

    get title() {
        return this.course.title;
    }

    get slug() {
        return this.course.data.slug;
    }

    get lessons() {
        return this.course.lessons;
    }

    get numberOfLessons() {
        return this.course.data.lessons_count;
    }

    get numberOfCompletedLessons() {
        return countCompleteLessonsInCourses([this.course]);
    }

    hasExam() {
        return this.course.data.has_exam;
    }

    isCourseFinished() {
        return this.numberOfCompletedLessons === this.numberOfLessons;
    }

    getLatestCompletion() {
        return getLatestCompletionInCourse(this.slug);
    }

    async getFullLessonObjects() {
        const lessonIds = this.lessons.map((lesson) => lesson.id);
        const lessons = [];
        for (const lessonId of lessonIds) {
            const lessonJSON = await _getOrFetchWagtailPageById(lessonId);
            lessons.push(new LessonPage(lessonJSON));
        }
        return lessons;
    }
}
