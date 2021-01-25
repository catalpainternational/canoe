import { BACKEND_BASE_URL } from "js/urls";
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
import { Page } from "ts/Implementations/Page";

export async function fetchManifest() {
    // try to get the manifest
    const manifest = new Manifest();
    try {
        return await manifest.getOrFetch();
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
    const page = new Page(manifest.pages[pageId]);
    return await page.getOrFetch();
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
    const currentLanguage = getLanguage();
    // This should be in a try catch block in case there's no manifest returned
    const manifest = new Manifest();
    const {page: rootHomePage} = await manifest.getRootPageDefinition("home", currentLanguage);
    const page = new Page(rootHomePage);
    if (rootHomePage.api_url) {
        const page = new Page(rootHomePage);
        return await page.getOrFetch();
    }

    return page;
};

export const getResourcesPage = async () => {
    const currentLanguage = getLanguage();
    // This should be in a try catch block in case there's no manifest returned
    const manifest = new Manifest();
    const {page: rootResourcesPage} = await manifest.getRootPageDefinition("resources", currentLanguage);
    const page = new Page(rootResourcesPage);
    if (rootResourcesPage.api_url) {
        const page = new Page(rootResourcesPage);
        return await page.getOrFetch();
    }

    return page;
};

export const getResources = async () => {
    // This should be in a try catch block in case there's no manifest returned
    const resourcesRootInfo = await getResourcesPage();
    const resRootHash = resourcesRootInfo ? resourcesRootInfo.loc_hash : "";
    const resourcesRootPath = (resRootHash)
        ? resRootHash.substring(resRootHash.lastIndexOf("/"))
        : ""; 

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
