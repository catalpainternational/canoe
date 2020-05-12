import { countNumberOfCompleteLessons } from "Actions/completion";

export const countCompleteLessonsInCourse = (course, lessons) => {
    return countNumberOfCompleteLessons(course, lessons);
};

export const countCompleteLessonsInCourses = (courses) => {
    let numberOfCompletedLessons = 0;

    for (const course of courses) {
        const { lessons } = course;
        const { slug: courseSlug } = course.data;
        const lessonSlugs = lessons.map((lesson) => lesson.slug);

        numberOfCompletedLessons += countCompleteLessonsInCourse(courseSlug, lessonSlugs);
    }
    return numberOfCompletedLessons;
};
