/*
    LearningStatistics is the interface between Canoe and Actions/completion.
*/

import {
    isTheCourseComplete,
    setComplete,
    isComplete,
    getFinishedLessonSlugs,
    getLatestCompletionInCourse,
    getLatestInCompletionArray,
} from "Actions/completion";
import {
    saveExamAnswer as saveAnswer,
    loadExamAnswer as loadAnswer,
    tallyExamScore as tallyScore,
    saveExamScore as saveScore,
    getExamHighScore as getHighScore,
} from "Actions/Exams";

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

export const saveExamAnswer = (questionId, answer) => {
    saveAnswer(questionId, answer);
};

export const loadExamAnswer = (questionId) => {
    return loadAnswer(questionId);
};

export const tallyFinalScore = (examQuestions) => {
    return tallyScore(examQuestions);
};

export const saveExamScore = (courseSlug, finalScore) => {
    saveScore(courseSlug, finalScore);
};

export const getExamHighScore = (courseSlug) => {
    return getHighScore(courseSlug);
};

const EXAM_SLUG = "exam";

export const markExamAsComplete = (courseSlug, finalScore) => {
    setComplete(courseSlug, EXAM_SLUG, EXAM_SLUG, { finalScore });
};

export const isExamComplete = (courseSlug) => {
    return isComplete(courseSlug, EXAM_SLUG, EXAM_SLUG);
};
