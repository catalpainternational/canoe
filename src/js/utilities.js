import { getMostRecentCompletion } from "Actions/completion";
import { getHomePage } from "js/WagtailPagesAPI";
import { dispatchToastEvent } from "js/Events";
import { getLanguage } from "ReduxImpl/Store";

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
    const lastCompletion = getMostRecentCompletion();
    if (lastCompletion === null) {
        return null;
    }

    const homePage = await getHomePage();
    const courses = homePage.courses;
    const lastWorkedOnCourse = courses.find(
        (course) => course.data.slug === lastCompletion.courseSlug
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
