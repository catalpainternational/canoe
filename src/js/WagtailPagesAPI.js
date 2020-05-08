import { BACKEND_BASE_URL, WAGTAIL_MANIFEST_URL } from "js/urls.js";
import { getAuthenticationToken } from "js/AuthenticationUtilities.js";
import {
    storeWagtailPage,
    getWagtailPageFromStore,
    getManifestFromStore,
    storeManifest,
    getHome,
    getCourse,
    getLesson,
    getLanguage,
} from "ReduxImpl/Store";

async function token_authed_fetch(url) {
    const token = getAuthenticationToken();

    const response = await fetch(url, {
        mode: "cors",
        headers: {
            "Content-Type": "text/json",
            Authorization: `JWT ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    const pagesResponseJSON = await response.json();

    if (pagesResponseJSON.items) {
        return pagesResponseJSON.items;
    }
    return pagesResponseJSON;
}

export async function fetchManifest() {
    const allPagesMetadata = await token_authed_fetch(WAGTAIL_MANIFEST_URL);
    return allPagesMetadata;
}

export async function fetchPage(path) {
    const pageMetadata = await token_authed_fetch(`${BACKEND_BASE_URL}${path}`);
    return pageMetadata;
}

export const fetchImage = async (url) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        // Workbox only caches crossorigin images.
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image.height);
        image.onerror = reject;
        image.src = `${BACKEND_BASE_URL}${url}`;
    });
};

export const getOrFetchManifest = async () => {
    const manifestInStore = getManifestFromStore();
    if (Object.entries(manifestInStore).length > 0) {
        return manifestInStore;
    }

    const manifest = await fetchManifest();
    storeManifest(manifest);
    return manifest;
};

export const getOrFetchWagtailPage = async (path) => {
    const pathPieces = path.split("/");
    const secondToLastPiece = pathPieces[pathPieces.length - 2];
    const pageId = Number(secondToLastPiece);

    const wagtailPageInStore = getWagtailPageFromStore(pageId);
    if (wagtailPageInStore) {
        return wagtailPageInStore;
    }

    const wagtailPage = await fetchPage(path);
    storeWagtailPage(wagtailPage);
    return wagtailPage;
};

const _getOrFetchWagtailPageById = async (pageId) => {
    const manifest = await getOrFetchManifest();
    const pagePath = manifest.pages[pageId];
    return getOrFetchWagtailPage(pagePath);
};

const _getHomePathInCurrentLanguage = (manifest) => {
    const { home: homes } = manifest;
    const currentLanguage = getLanguage();
    return homes[currentLanguage];
};

export const getHomePathsInManifest = (manifest) => {
    const { home: homes } = manifest;
    const homePaths = [];
    for (const languageCode in homes) {
        const homePagePath = homes[languageCode];
        homePaths.push(homePagePath);
    }
    return homePaths;
};

export const getHomePage = async () => {
    const manifest = await getOrFetchManifest();
    const homePagePath = _getHomePathInCurrentLanguage(manifest);
    const homePage = await getOrFetchWagtailPage(homePagePath);
    return homePage;
};

export const getCourseById = async (courseId) => {
    await _getOrFetchWagtailPageById(courseId);
    // Until we can switch to a flatter data representation, this ensures the
    // store has the course.

    const course = getCourse(courseId);
    if (!course) {
        throw new Error(`Course ${courseId} doesn't exist.`);
    }
    return course;
};

export const getLessonById = async (lessonId) => {
    await _getOrFetchWagtailPageById(lessonId);
    // Until we can switch to a flatter data representation, this ensures the
    // store has the lesson.

    const lesson = getLesson(lessonId);
    if (!lesson) {
        throw new Error(`Lesson ${lessonId} doesn't exist.`);
    }
    return lesson;
};

export const getACoursesLessons = async (courseId) => {
    const course = await getCourseById(courseId);
    const lessonIds = course.lessonIds;
    const lessons = [];

    for (const lessonId of lessonIds) {
        const lesson = await getLessonById(lessonId);
        lessons.push(lesson);
    }

    return lessons;
};

export const getALessonsCourse = async (lessonId) => {
    const lesson = await getLessonById(lessonId);
    const parentCourseId = lesson.parentId;
    const parentCourse = await getCourseById(parentCourseId);
    return parentCourse;
};
