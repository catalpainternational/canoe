/*
    CompletionInterface inverts the dependency between Canoe and Actions/completion.
*/

import {
    isTheCourseComplete,
    setComplete,
    isComplete,
    getFinishedLessonSlugs,
    getLatestCompletionInCourse,
    getLatestInCompletionArray,
    pullCompletionsIntoMemory as pullCompletions,
    clearInMemoryCompletions as clearCompletions,
} from "Actions/completion";

const getCourseAndLessonSlugs = (wagtailCoursePage) => {
    const { slug, has_exam } = wagtailCoursePage.data;
    const lessons = wagtailCoursePage.lessons;

    const courseSlug = slug;
    const lessonSlugs = lessons.map((lesson) => lesson.slug);
    if (has_exam) {
        lessonSlugs.push(EXAM_SLUG);
    }

    return {
        courseSlug,
        lessonSlugs,
    };
};

export const isCourseInProgress = (aWagtailCourse) => {
    const { courseSlug, lessonSlugs } = getCourseAndLessonSlugs(aWagtailCourse);
    return !isTheCourseComplete(courseSlug, lessonSlugs);
};

export const getLatestCompletion = (wagtailCourses) => {
    const latestCompletions = [];
    for (const course of wagtailCourses) {
        if (!isCourseInProgress(course)) {
            continue;
        }

        const { slug: courseSlug } = course.data;
        const latestCompletionInCourse = getLatestCompletionInCourse(courseSlug);
        if (!latestCompletionInCourse) {
            continue;
        }
        latestCompletions.push(latestCompletionInCourse);
    }

    const latestCompletion = getLatestInCompletionArray(latestCompletions);
    return latestCompletion;
};

export const countCompleteLessonsInCourses = (wagtailCourses) => {
    let numberOfCompletedLessons = 0;

    for (const course of wagtailCourses) {
        const { courseSlug, lessonSlugs } = getCourseAndLessonSlugs(course);
        numberOfCompletedLessons += countFinishedLessonsAmongSlugs(courseSlug, lessonSlugs);
    }
    return numberOfCompletedLessons;
};

export const countFinishedLessonsAmongSlugs = (courseSlug, slugsOfLiveLessons) => {
    return getFinishedLessonSlugs(courseSlug, slugsOfLiveLessons).length;
};

export const clearInMemoryCompletions = () => {
    clearCompletions();
};

export const pullCompletionsIntoMemory = async () => {
    await pullCompletions();
};

const EXAM_SLUG = "exam";

export const markExamAsComplete = (courseSlug, finalScore) => {
    setComplete(courseSlug, EXAM_SLUG, EXAM_SLUG, { finalScore });
};

export const isExamComplete = (courseSlug) => {
    return isComplete(courseSlug, EXAM_SLUG, EXAM_SLUG);
};
