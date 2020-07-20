/*
    LearningStatistics is the interface between Canoe and Actions/completion.
*/

import { getCourseAndLessonSlugs } from "js/utilities";
import {
    isTheCourseComplete,
    setComplete,
    isComplete,
    countCompleteLessonsInCourse as countCompleteLessonsImpl,
    getLatestCompletionInCourse,
    getLatestInCompletionArray,
} from "Actions/completion";
import {
    saveExamAnswer as saveAnswer,
    loadExamAnswer as loadAnswer,
    tallyExamScore as tallyScore,
} from "Actions/Exams";

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

export const saveExamAnswer = (questionId, answer) => {
    saveAnswer(questionId, answer);
};

export const loadExamAnswer = (questionId) => {
    return loadAnswer(questionId);
};

export const tallyFinalScore = (examQuestions) => {
    return tallyScore(examQuestions);
};

const EXAM_SLUG = "exam";

export const markExamAsComplete = (courseSlug, finalScore) => {
    setComplete(courseSlug, EXAM_SLUG, EXAM_SLUG, { finalScore });
};

export const isExamComplete = (courseSlug) => {
    return isComplete(courseSlug, EXAM_SLUG, EXAM_SLUG);
};
