import { BACKEND_BASE_URL, ROUTES_FOR_REGISTRATION } from "js/urls";
import { isGuestUser } from "js/AuthenticationUtilities";
import {
    storeWagtailPage,
    getWagtailPageFromStore,
    getCourse,
    getLesson,
    getLanguage,
    changeLanguage,
} from "ReduxImpl/Interface";
import { token_authed_fetch } from "js/Fetch";
import { Manifest } from "ts/Implementations/Manifest";

export async function fetchManifest() {
    // try to get the manifest
    const manifest = new Manifest();
    try {
        return await manifest.getOrFetchManifest();
    } catch {
        // Do nothing - fall through to the promise reject below
    }

    return Promise.reject();
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

export const _getOrFetchWagtailPageById = async (pageId) => {
    // This should be in a try catch block in case there's no manifest returned
    const manifest = await fetchManifest();
    const pagePath = manifest.pages[pageId];
    return getOrFetchWagtailPage(pagePath);
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

const _getNextAvailablePageImpl = async (pagePathByLangCode, pageTypeString) => {
    const languageCodes = Object.keys(pagePathByLangCode);
    if (languageCodes.length === 0) {
        throw new Error(`The manifest lacks ${pageTypeString}s`);
    }
    const nextLanguage = languageCodes[0];
    const pagePath = pagePathByLangCode[nextLanguage];
    const page = await getOrFetchWagtailPage(pagePath);
    changeLanguage(nextLanguage);
    return page;
};

const _getNextAvailableHomePage = async (manifestHomes) => {
    return _getNextAvailablePageImpl(manifestHomes, "HomePage");
};

const _getNextAvailableResourcesRoot = async (resourcesRootInfo) => {
    return _getNextAvailablePageImpl(resourcesRootInfo, "ResourcesRoot");
};

export const getHomePage = async () => {
    // This should be in a try catch block in case there's no manifest returned
    const manifest = await fetchManifest();
    const { home: homes } = manifest;
    const currentLanguage = getLanguage();
    const homePagePath = homes[currentLanguage];

    if (homePagePath) {
        return await getOrFetchWagtailPage(homePagePath);
    } else {
        return await _getNextAvailableHomePage(homes);
    }
};

export const getResources = async () => {
    // This should be in a try catch block in case there's no manifest returned
    const manifest = await fetchManifest();
    const { resourcesRoot: resourcesRootInfo } = manifest;
    const currentLanguage = getLanguage();
    const resourcesRootPath = resourcesRootInfo[currentLanguage];

    let resourcesRoot = null;
    if (resourcesRootPath) {
        resourcesRoot = await getOrFetchWagtailPage(resourcesRootPath);
    } else {
        resourcesRoot = await _getNextAvailableResourcesRoot(resourcesRootInfo);
    }

    const resources = [];
    for (const childPageId of resourcesRoot.data.children) {
        const childPage = await _getOrFetchWagtailPageById(childPageId);
        if (!childPage.is_visible_to_guests && isGuestUser()) {
            continue;
        }
        resources.push(childPage);
    }
    return resources;
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
