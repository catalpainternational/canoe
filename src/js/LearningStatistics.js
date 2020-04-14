import { countComplete } from "Actions/completion";

export const getNumberOfCompletedLessons = (courses) => {
    let numberOfCompletedLessons = 0;
    for (const course of courses) {
        numberOfCompletedLessons += getNumberOfCompletedLessonsFor(course);
    }
    return numberOfCompletedLessons;
};

export const getNumberOfCompletedLessonsFor = (course) => {
    console.log(course);
    return countComplete(course.data.slug);
};
