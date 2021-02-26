import { BACKEND_BASE_URL, ROUTES_FOR_REGISTRATION } from "js/urls";
import { isGuestUser } from "js/AuthenticationUtilities";
import {
    // storeWagtailPage,
    getWagtailPageFromStore,
    getManifestFromStore,
    storeManifest,
    getCourse,
    getLesson,
    getLanguage,
    changeLanguage,
} from "ReduxImpl/Interface";
import { token_authed_fetch, unauthed_fetch } from "js/Fetch";

export async function fetchManifest() {
    const allPagesMetadata = await token_authed_fetch(ROUTES_FOR_REGISTRATION.manifest);
    return allPagesMetadata;
}

/** Intended for use by Wagtail to generate previews */
export async function fetchPageNoAuth(path) {
    const pageMetadata = await unauthed_fetch(`${BACKEND_BASE_URL}${path}`);	
    return pageMetadata;	
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
    // storeWagtailPage(wagtailPage);
    return wagtailPage;
};

export const _getOrFetchWagtailPageById = async (pageId) => {
    // Uses new manifest format
    const manifest = await getOrFetchManifest();
    const page = manifest.pages[pageId];
    const pagePath = page ? page.api_url : "";
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

const getLanguageCodes = (manifest) => {
    const languageCodes = new Set(
        Object.values(manifest.pages).map((page) => {
            return page.languageCode;
        })
    );

    return [...languageCodes];
}

const getRootPage = (manifest, rootName = "home", languageCode = "en") => {
    const matchingPages = Object.values(manifest.pages).filter(
        (page) => {
            // Check there is a location hash and languages
            // - this is a sanity check only
            if (!page || !page.loc_hash || !page.language) {
                return false;
            }

            // Check the location hash is for the nominal 'root' of what we're interested in
            const hashParts = page.loc_hash.split("/").filter((part) => !!part);
            if (
                hashParts.length > 2 ||
                hashParts[hashParts.length - 1].indexOf(rootName) === -1
            ) {
                return false;
            }

            // Check the language matches
            if (languageCode === "tet" || languageCode === "tdt") {
                // Check for both 'tet' and 'tdt' together
                // We should be using 'tdt', but for historical reasons we usually use 'tet'
                // so we're treating them the same
                return page.language === "tet" || page.language === "tdt";
            }
            return page.language.indexOf(languageCode) === 0;
        }
    );

    return matchingPages.length === 1
        ? matchingPages[0]
        : undefined;
};

export const getHomePage = async () => {
    // Uses new manifest format
    const currentLanguage = getLanguage();
    const manifest = await getOrFetchManifest();

    const getHomePageUrl = (languageCode) => {
        const homePage = getRootPage(manifest, "home", languageCode);
        return homePage.api_url || "";
    };

    let homePagePath = getHomePageUrl(currentLanguage);
    if (homePagePath) {
        return await getOrFetchWagtailPage(homePagePath);
    }

    const manifestLanguages = getLanguageCodes(manifest);
    manifestLanguages.forEach((languageCode) => {
        homePagePath = getHomePageUrl(languageCode);
        if (homePagePath) {
            return;
        }
    });
    if (homePagePath) {
        return await getOrFetchWagtailPage(homePagePath);
    }
    // No page to return
};

export const getResources = async () => {
    // Uses new manifest format
    const currentLanguage = getLanguage();
    const manifest = await getOrFetchManifest();
    
    const getResourcePageUrl = (languageCode) => {
        const resourcePage = getRootPage(manifest, "resources", languageCode);
        return resourcePage.api_url || "";
    };

    let resourcesRoot = null;
    let resourcePagePath = getResourcePageUrl(currentLanguage);
    if (resourcePagePath) {
        resourcesRoot = await getOrFetchWagtailPage(resourcePagePath);
    }

    if (!resourcesRoot) {
        const manifestLanguages = getLanguageCodes(manifest);
        manifestLanguages.forEach((languageCode) => {
            resourcePagePath = getResourcePageUrl(languageCode);
            if (resourcePagePath) {
                return;
            }
        });
        if (resourcePagePath) {
            resourcesRoot = await getOrFetchWagtailPage(resourcePagePath);
        }        
    }

    const resources = [];
    if (resourcesRoot) {
        for (const childPageId of resourcesRoot.data.children) {
            const childPage = await _getOrFetchWagtailPageById(childPageId);
            if (!childPage.is_visible_to_guests && isGuestUser()) {
                continue;
            }
            resources.push(childPage);
        }
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
