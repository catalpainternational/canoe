import { isExamComplete, countCompleteLessonsInCourses } from "js/CompletionInterface";
import { getLatestCompletionInCourse } from "Actions/completion";
import { _getOrFetchWagtailPageById } from "js/WagtailPagesAPI";

import { getExamHighScore as getHighScore, hasUserTriedExam as hasTriedExam } from "Actions/exam";

import LessonPage from "./LessonPage";

export default class CoursePage {
    constructor(aWagtailCourse) {
        this.course = aWagtailCourse;
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

    get numberOfFinishedLessons() {
        return countCompleteLessonsInCourses([this.course]);
    }

    get tags() {
        return this.course.tags;
    }

    get exam() {
        return this.course.exam;
    }

    hasExam() {
        return this.course.data.has_exam;
    }

    isExamFinished() {
        return isExamComplete(this.slug);
    }

    hasUserTriedExam() {
        return hasTriedExam(this.slug);
    }

    getExamHighScore() {
        return getHighScore(this.slug);
    }

    isCourseFinished() {
        return this.numberOfFinishedLessons === this.numberOfLessons;
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
