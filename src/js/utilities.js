import { getLanguage } from "ReduxImpl/Interface";
import { BACKEND_BASE_URL, MEDIA_PATH } from "js/urls";
import { getOrFetchManifest } from "js/WagtailPagesAPI";

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
    return `${BACKEND_BASE_URL}${MEDIA_PATH}/${mediaPath}`;
};

export const resolveMedia = (mediaID) => {
    return getOrFetchManifest()
        // Choose smallest media item. Much more elaborate strategies are possible, but they need coordination with the backend 
        // (through TranscodeDefinition objects) to establish a convention on label use. For instance, for audio, the bitrate
        // (32/64/128kbit ?) could be encoded into the label, and so could the codec (opus/ogg ?).
        .then(mfest => getMediaUrl(Object.values(mfest.media[mediaID]).sort((el1,el2) => el1.size - el2.size)[0].mediapath));
};

export const doesTheArrayContainTheObject = (theArray, theObject, matchingFunction) => {
    // matchingFunction takes two objects as input and returns true when those
    // objects "match".
    if (theArray.length === 0) {
        return false;
    }

    for (const arrayObject of theArray) {
        if (matchingFunction(arrayObject, theObject)) {
            return true;
        }
    }
    return false;
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

export const getContactNumber = () => {
    return process.env.CONTACT_NUMBER;
};

export const getCourseWithLatestCompletion = (courses) => {
    const coursesWithCompletions = courses.filter((course) => course.getLatestCompletion());

    let lastWorkedOnCourse = null;
    for (const course of coursesWithCompletions) {
        if (
            lastWorkedOnCourse &&
            !course.isFinished() &&
            course.getLatestCompletion().completionDate <
                lastWorkedOnCourse.getLatestCompletion().completionDate
        ) {
            continue;
        }
        lastWorkedOnCourse = course;
    }
    return lastWorkedOnCourse;
};
