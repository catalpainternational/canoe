import { getLanguage } from "ReduxImpl/Interface";
import { BACKEND_BASE_URL } from "js/urls";

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


export const simplePluralize = (count, noun, suffix = 's') => {
    return `${count} ${noun}${count !== 1 ? suffix : ''}`;
}

export const getElapsedTime = (givenDate) => {
    const minuteInMs = 1 * 60 * 1000;
    const hourInMs = minuteInMs * 60;
    const dayInMs = hourInMs * 24;
    const weekInMs = dayInMs * 7;
    const monthInMs = dayInMs * 30;
    const yearInMs = dayInMs * 365;

    const today = new Date();
    const elapsedTime = today - new Date(givenDate);

    // TODO this needs translatin!
    if (elapsedTime < minuteInMs) {
        return 'Seconds ago';
    }
    if (elapsedTime < hourInMs) {
        const timeInMins = Math.round(elapsedTime / minuteInMs);
        return `${simplePluralize(timeInMins, 'minute')} ago`;
    }
    if (elapsedTime < dayInMs) {
        const timeInHours = Math.round(elapsedTime / hourInMs);
        return `${simplePluralize(timeInHours, 'hour')} ago`;
    }
    if (elapsedTime < weekInMs) {
        const timeInDays = Math.round(elapsedTime / dayInMs)
        return `${simplePluralize(timeInDays, 'day')} ago`;
    }
    if (elapsedTime < monthInMs) {
        const timeInWeeks = Math.round(elapsedTime / weekInMs);
        return `${simplePluralize(timeInWeeks, 'week')} ago`;
    }
    if (elapsedTime < yearInMs) {
        const timeInMonths = Math.round(elapsedTime / monthInMs);
        return `${simplePluralize(timeInMonths, 'month')} ago`;
    }
    if (elapsedTime >= yearInMs) {
        const timeInYears = Math.round(elapsedTime / yearInMs);
        return `${simplePluralize(timeInYears, 'year')} ago`;
    }
}

export const hashString = (string) => {
    // Generate an unsigned 32 bit integer hash from any string
    let hash = 0;
    for (let ix = 0; ix < string.length; ix++) {
        const char = string.charCodeAt(ix);
        hash = char + (hash << 6) + (hash << 16) - hash; // magic constant is (effectively) 65599
    }
    const bit32 = Math.pow(2, 32);
    hash = hash < 0 ? Math.ceil(hash) : Math.floor(hash);
    return hash - Math.floor(hash / bit32) * bit32;
}

export const externalLinks = (parentElement) => {
    // Set the target for all external links to "_blank"
    const absolutePath = new RegExp('^(?:[a-z]+:)?//', 'i');
    const links = [...parentElement.getElementsByTagName('a')];

    links.forEach((link) => {
        if (absolutePath.test(link.href)) {
            link.target = "_blank"
        }
    })
}
