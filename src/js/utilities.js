import { getHomePage } from "js/WagtailPagesAPI";
import { getLatestCompletion } from "js/LearningStatistics";
import { dispatchToastEvent } from "js/Events";
import { getLanguage } from "ReduxImpl/Store";
import { BACKEND_BASE_URL } from "js/urls";

export const alertAppIsOffline = () => {
    dispatchToastEvent("You are offline.");
};

export const alertAppIsOnline = () => {
    dispatchToastEvent("You are online.");
};

export const getAllLessons = (courses) => {
    let lessons = [];
    for (const course of courses) {
        lessons = lessons.concat(course.lessons);
    }
    return lessons;
};

export const getLastWorkedOnCourse = async () => {
    const homePage = await getHomePage();
    const courses = homePage.courses;
    const latestCompletion = getLatestCompletion(courses);
    const lastWorkedOnCourse = courses.find(
        (course) => course.data.slug === latestCompletion.courseSlug
    );
    return lastWorkedOnCourse;
};

export const isCourseInTheCurrentLanguage = (courseSlug) => {
    const currentLanguage = getLanguage();
    switch (currentLanguage) {
        case "en":
            return !courseSlug.includes("tet");
        case "tet":
            return courseSlug.includes("tet");
        default:
            throw new Error(`Courses in ${currentLanguage} don't exist.`);
    }
};

export const getMediaUrl = (mediaPath) => {
    return `${BACKEND_BASE_URL}${mediaPath}`;
};

export const getCourseAndLessonSlugs = (wagtailCoursePage) => {
    const { slug: courseSlug } = wagtailCoursePage.data;
    const lessons = wagtailCoursePage.lessons;
    const lessonSlugs = lessons.map((lesson) => lesson.slug);
    return {
        courseSlug,
        lessonSlugs,
    };
};

// From: https://levelup.gitconnected.com/debounce-in-javascript-improve-your-applications-performance-5b01855e086
export const debounce = (func, waitInMilliseconds) => {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, waitInMilliseconds);
    };
};
