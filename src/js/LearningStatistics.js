/*
    LearningStatistics is the interface between Canoe and Actions/completion.
*/

import { getCourseAndLessonSlugs } from "js/utilities";
import {
    isTheCourseComplete,
    countCompleteLessonsInCourse as countCompleteLessonsImpl,
    getLatestCompletionInCourse,
    getLatestInCompletionArray,
} from "Actions/completion";

export const isCourseInProgress = (aWagtailCourse) => {
    const { courseSlug, lessonSlugs } = getCourseAndLessonSlugs(aWagtailCourse);
    return !isTheCourseComplete(courseSlug, lessonSlugs);
};

export const getLatestCompletion = (wagtailCourses) => {
    const latestCompletions = [];
    for (const course of wagtailCourses) {
        const { courseSlug, lessonSlugs } = getCourseAndLessonSlugs(course);

        if (isTheCourseComplete(courseSlug, lessonSlugs)) {
            continue;
        }

        const latestInCourse = getLatestCompletionInCourse(courseSlug);
        if (!latestInCourse) {
            continue;
        }
        latestCompletions.push(latestInCourse);
    }

    const latestCompletion = getLatestInCompletionArray(latestCompletions);
    return latestCompletion;
};

export const countCompleteLessonsInCourse = (courseSlug, lessonSlugs) => {
    return countCompleteLessonsImpl(courseSlug, lessonSlugs);
};

export const countCompleteLessonsInCourses = (wagtailCourses) => {
    let numberOfCompletedLessons = 0;

    for (const course of wagtailCourses) {
        const { courseSlug, lessonSlugs } = getCourseAndLessonSlugs(course);
        numberOfCompletedLessons += countCompleteLessonsInCourse(courseSlug, lessonSlugs);
    }
    return numberOfCompletedLessons;
};
