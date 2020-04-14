import { countComplete } from "Actions/completion";
import { countNumberOfCompleteLessons } from "Actions/completion";

export const getNumberOfCompletedLessons = (courses) => {
    let numberOfCompletedLessons = 0;
    for (const course of courses) {
        numberOfCompletedLessons += getNumberOfCompletedLessonsFor(course);
    }
    return numberOfCompletedLessons;
};

export const getNumberOfCompletedLessonsFor = (course) => {
    return countComplete(course.data.slug);
};

export const getNumberOfCompleteLessons = (course, lessons) => {
    return countNumberOfCompleteLessons(course, lessons);
};
