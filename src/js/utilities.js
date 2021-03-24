import { getLanguage } from "ReduxImpl/Interface";
import { BACKEND_BASE_URL, MEDIA_PATH } from "js/urls";

import contentStockImg from "img/stock_content.png";
import courseStockImg from "img/stock_course.png";
import lessonStockImg from "img/stock_lesson.png";
import objectiveStockImg from "img/stock_objective.png";
import testStockImg from "img/stock_test.png";

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

export const getHtmlUrl = (htmlPath) => {
    return `${BACKEND_BASE_URL}${htmlPath}`;
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

export const getCardImageUrl = (link, imageUrl) => {
    const stockImages = [
        contentStockImg,
        courseStockImg,
        lessonStockImg,
        objectiveStockImg,
        testStockImg,
    ];
    const cardId = typeof link === "number" ? link : link.split("/")[0];

    const fallbackImg = stockImages[cardId % stockImages.length];

    return imageUrl
        ? `${process.env.API_BASE_URL}${imageUrl}?cardImageFallback=${fallbackImg}`
        : fallbackImg;
};
