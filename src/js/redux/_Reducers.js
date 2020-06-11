import { combineReducers } from "redux";

export const UPDATED_MANIFEST = "UPDATED_MANIFEST";
export const SITE_DOWNLOADED = "SITE_DOWNLOADED";
export const ADDED_WAGTAIL_PAGE = "ADDED_WAGTAIL_PAGE";
export const ADDED_HOME_PAGE = "ADDED_HOME_PAGE";
export const ADDED_COURSE_PAGE = "ADDED_COURSE_PAGE";
export const ADDED_LESSON_PAGE = "ADDED_LESSON_PAGE";
export const LANGUAGE_CHANGE = "LANGUAGE_CHANGED";
export const UPDATED_BROWSER_SUPPORT = "UPDATED_BROWSER_SUPPORT";
export const SERVICE_WORKER_EVENT = "SERVICE_WORKER_EVENT";

const updateManifest = (state = {}, action) => {
    switch (action.type) {
        case UPDATED_MANIFEST:
            return action.manifest;
        default:
            return state;
    }
};

const signalSiteIsDownloaded = (state = false, action) => {
    switch (action.type) {
        case SITE_DOWNLOADED:
            return action.siteIsDownloaded;
        default:
            return state;
    }
};

const addWagtailPage = (state = {}, action) => {
    switch (action.type) {
        case ADDED_WAGTAIL_PAGE:
            const newPageObject = { [action.wagtailPage.id]: action.wagtailPage };
            const nextState = Object.assign({}, state, newPageObject);
            return nextState;
        default:
            return state;
    }
};

const addHome = (state = {}, action) => {
    switch (action.type) {
        case ADDED_HOME_PAGE:
            const home = action.home;

            let languageCode = null;
            if (home.meta.slug.includes("tet")) {
                languageCode = "tet";
            } else {
                languageCode = "en";
            }

            const newHome = {
                [languageCode]: {
                    id: home.id,
                    type: home.meta.type,
                    title: home.title,
                    slug: home.meta.slug,
                    body: home.body,
                    courseIds: home.courses.map((course) => course.data.id),
                    parentId: home.meta.parent,
                },
            };
            const nextState = Object.assign({}, state, newHome);
            return nextState;
        default:
            return state;
    }
};

const addCourse = (state = {}, action) => {
    switch (action.type) {
        case ADDED_COURSE_PAGE:
            const course = action.course;
            const newCourse = {
                [course.id]: {
                    id: course.id,
                    type: course.meta.type,
                    title: course.title,
                    slug: course.data.slug,
                    parentId: course.meta.parent.id,
                    lessonIds: course.lessons.map((lesson) => lesson.id),
                },
            };
            const nextState = Object.assign({}, state, newCourse);
            return nextState;
        default:
            return state;
    }
};

const addLesson = (state = {}, action) => {
    switch (action.type) {
        case ADDED_LESSON_PAGE:
            const lesson = action.lesson;
            const newLesson = {
                [lesson.id]: {
                    id: lesson.id,
                    type: lesson.meta.type,
                    title: lesson.title,
                    slug: lesson.data.slug,
                    short_description: lesson.data.description,
                    long_description: lesson.data.long_description,
                    duration: lesson.data.duration,
                    jobs: lesson.data.jobs,
                    coming_soon: lesson.data.coming_soon,
                    objectives: lesson.objective,
                    content: lesson.content,
                    test: lesson.test,
                    parentId: lesson.meta.parent.id,
                },
            };
            const nextState = Object.assign({}, state, newLesson);
            return nextState;
        default:
            return state;
    }
};

const changeLanguage = (state = "", action) => {
    switch (action.type) {
        case LANGUAGE_CHANGE:
            return action.language;
        default:
            return state;
    }
};

const signalBrowserSupport = (state = false, action) => {
    switch (action.type) {
        case UPDATED_BROWSER_SUPPORT:
            return action.isBrowserSupported;
        default:
            return state;
    }
};

const serviceWorker = (state = "unknown", action) => {
    switch (action.type) {
        case SERVICE_WORKER_EVENT:
            switch (action.event_type) {
                case "controlling":
                    return "controlling";
                case "redundant":
                    return state === "controlling" ? "update-waiting" : "install-failed";
                case "update-waiting":
                    return "update-waiting";
                case "notsupported":
                    return "notsupported";
                default:
                    return "unknown";
            }
        default:
            return state;
    }
};

export const reducers = combineReducers({
    manifest: updateManifest,
    siteIsDownloaded: signalSiteIsDownloaded,
    pages: addWagtailPage,
    home: addHome,
    courses: addCourse,
    lessons: addLesson,
    language: changeLanguage,
    isBrowserSupported: signalBrowserSupport,
    serviceWorker: serviceWorker,
});
