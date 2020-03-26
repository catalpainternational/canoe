import { countComplete } from "Actions/completion";

export const isAppOffline = error => {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
        return true;
    } else {
        return false;
    }
};

export const alertAppIsOffline = () => {
    alert("You are not connected to the internet.");
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
