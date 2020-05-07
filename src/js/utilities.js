import { getMostRecentCompletion } from "Actions/completion";
import { getOrFetchManifest, getOrFetchWagtailPage } from "js/WagtailPagesAPI";
import { dispatchToastEvent } from "js/Events";

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

    const manifest = await getOrFetchManifest();
    const homePage = await getOrFetchWagtailPage(manifest.home);
    const courses = homePage.courses;
    const lastWorkedOnCourse = courses.find(
        (course) => course.data.slug === lastCompletion.courseSlug
    );
    return lastWorkedOnCourse;
};
