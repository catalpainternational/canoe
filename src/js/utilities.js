import { getLatestCompletion } from "js/LearningStatistics";
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

export const getHomePageId = (homePageUrl) => {
    const urlsPieces = homePageUrl.split("/");
    const pageIdPiece = urlsPieces[urlsPieces.length - 2];
    const pageId = Number(pageIdPiece);
    return pageId;
};

export const getLastWorkedOnCourse = async () => {
    const manifest = await getOrFetchManifest();
    const homePage = await getOrFetchWagtailPage(manifest.home);
    const courses = homePage.courses;
    const latestCompletion = getLatestCompletion(courses);
    const lastWorkedOnCourse = courses.find(
        (course) => course.data.slug === latestCompletion.courseSlug
    );
    return lastWorkedOnCourse;
};

export const getCourseAndLessonSlugs = (wagtailCoursePage) => {
    const { slug: courseSlug } = wagtailCoursePage.data;
    const lessons = wagtailCoursePage.lessons;
    const lessonSlugs = lessons.map((lesson) => lesson.slug);
    return {
        courseSlug,
        lessonSlugs,
    };
};
