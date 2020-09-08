import { getLatestCompletionInCourse, getFinishedLessonSlugs } from "Actions/completion";
import { _getOrFetchWagtailPageById } from "js/WagtailPagesAPI";

import { getExamHighScore as getHighScore, hasUserTriedExam as hasTriedExam } from "Actions/exam";

import ExamGrader from "js/ExamGrader";
import LessonPage from "./LessonPage";

const getCourseAndLessonSlugs = (wagtailCoursePage) => {
    const { slug, has_exam } = wagtailCoursePage.data;
    const lessons = wagtailCoursePage.lessons;

    const courseSlug = slug;
    const lessonSlugs = lessons.map((lesson) => lesson.slug);
    if (has_exam) {
        lessonSlugs.push("exam");
    }

    return {
        courseSlug,
        lessonSlugs,
    };
};

const countCompleteLessons = (wagtailCourse) => {
    const { courseSlug, lessonSlugs } = getCourseAndLessonSlugs(wagtailCourse);
    return getFinishedLessonSlugs(courseSlug, lessonSlugs).length;
};

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
        return countCompleteLessons(this.course);
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
        return ExamGrader.isExamFinished(this.slug);
    }

    hasUserTriedExam() {
        return hasTriedExam(this.slug);
    }

    getExamHighScore() {
        return getHighScore(this.slug);
    }

    isFinished() {
        return this.numberOfFinishedLessons === this.numberOfLessons;
    }

    getLatestCompletion() {
        const liveLessons = this.lessons.map((lesson) => lesson.slug);
        return getLatestCompletionInCourse(this.slug, liveLessons);
    }

    isVisibleToGuests() {
        return this.course.is_visible_to_guests;
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
