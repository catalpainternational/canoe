import { getMostRecentCompletion, countComplete } from "Actions/completion";
import { getOrFetchManifest, getOrFetchWagtailPage } from "js/WagtailPagesAPI";
import { dispatchToastEvent } from "js/Events";

export const alertAppIsOffline = () => {
    dispatchToastEvent("You are offline.");
};

export const alertAppIsOnline = () => {
    dispatchToastEvent("You are online.");
};

export const getAllLessons = courses => {
    let lessons = [];
    for (const course of courses) {
        lessons = lessons.concat(course.lessons);
    }
    return lessons;
};

export const getNumberOfCompletedLessons = courses => {
    let numberOfCompletedLessons = 0;
    for (const course of courses) {
        numberOfCompletedLessons += getNumberOfCompletedLessonsFor(course);
    }
    return numberOfCompletedLessons;
};

export const getNumberOfCompletedLessonsFor = course => {
    return countComplete(course.data.slug);
};

export const getHomePageId = homePageUrl => {
    const urlsPieces = homePageUrl.split("/");
    const pageIdPiece = urlsPieces[urlsPieces.length - 2];
    const pageId = Number(pageIdPiece);
    return pageId;
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
        course => course.data.slug === lastCompletion.courseSlug
    );
    return lastWorkedOnCourse;
};
