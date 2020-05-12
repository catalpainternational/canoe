import { countNumberOfCompleteLessons } from "Actions/completion";
import { getCourseAndLessonSlugs } from "js/utilities";

export const countCompleteLessonsInCourse = (course, lessons) => {
    return countNumberOfCompleteLessons(course, lessons);
};

export const countCompleteLessonsInCourses = (courses) => {
    let numberOfCompletedLessons = 0;

    for (const course of courses) {
        const { courseSlug, lessonSlugs } = getCourseAndLessonSlugs(course);
        numberOfCompletedLessons += countCompleteLessonsInCourse(courseSlug, lessonSlugs);
    }
    return numberOfCompletedLessons;
};
