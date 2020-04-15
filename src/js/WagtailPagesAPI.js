import { BACKEND_BASE_URL, WAGTAIL_MANIFEST_URL } from "js/urls.js";
import { getAuthenticationToken } from "js/AuthenticationUtilities.js";
import {
    storeWagtailPage,
    getWagtailPageFromStore,
    getManifestFromStore,
    storeManifest,
    getLessonById,
    getCourseById,
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

export const fetchImage = async (path) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        // Workbox only caches crossorigin images.
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image.height);
        image.onerror = reject;
        image.src = `${BACKEND_BASE_URL}${path}`;
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

export const getACoursesLessons = async (courseId) => {
    await _getOrFetchWagtailPageById(courseId);

    const course = getCourseById(courseId);
    const lessonIds = course.lessonIds;
    const lessons = [];

    for (const lessonId of lessonIds) {
        await _getOrFetchWagtailPageById(lessonId);
        const lesson = getLessonById(lessonId);
        lessons.push(lesson);
    }
    return lessons;
};

export const getALessonsCourse = async (lessonId) => {
    await _getOrFetchWagtailPageById(lessonId);

    const lesson = getLessonById(lessonId);
    const parentCourseId = lesson.parentId;
    await _getOrFetchWagtailPageById(parentCourseId);
    const parentCourse = getCourseById(parentCourseId);
    return parentCourse;
};
