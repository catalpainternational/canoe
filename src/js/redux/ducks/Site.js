// ACTIONS
const ADDED_MANIFEST = "site/addedManifest";
const ADDED_WAGTAIL_PAGE = "site/addedPage";
const ADDED_HOME_PAGE = "site/addedHome";
const ADDED_COURSE_PAGE = "site/addedCourse";
const ADDED_LESSON_PAGE = "site/addedLessons";
const FETCHING_MANIFEST = "site/fetchingManifest";

// ACTION CREATORS
export const addManifest = (manifest) => ({ type: ADDED_MANIFEST, manifest });
export const addPage = (wagtailPage) => ({ type: ADDED_WAGTAIL_PAGE, wagtailPage });
export const addHome = (wagtailPage) => ({ type: ADDED_HOME_PAGE, home: wagtailPage });
export const addCourse = (wagtailPage) => ({ type: ADDED_COURSE_PAGE, course: wagtailPage });
export const addLesson = (wagtailPage) => ({ type: ADDED_LESSON_PAGE, lesson: wagtailPage });
export const fetchingManifestAction = (fetching) => ({ type: FETCHING_MANIFEST, fetching: fetching });

// REDUCERS
const manifest = (state = {}, action) => {
    switch (action.type) {
        case ADDED_MANIFEST:
            return action.manifest;
        default:
            return state;
    }
};

const pages = (state = {}, action) => {
    switch (action.type) {
        case ADDED_WAGTAIL_PAGE:
            const { wagtailPage } = action;
            const newPageObject = { [wagtailPage.id]: wagtailPage };
            const nextState = Object.assign({}, state, newPageObject);
            return nextState;
        default:
            return state;
    }
};

const home = (state = {}, action) => {
    switch (action.type) {
        case ADDED_HOME_PAGE:
            const { id, meta, title, body, courses } = action.home;
            const { slug, type, parent } = meta;

            let languageCode = null;
            if (slug.includes("tet")) {
                languageCode = "tet";
            } else {
                languageCode = "en";
            }

            const newHome = {
                [languageCode]: {
                    id,
                    type,
                    title,
                    slug,
                    body,
                    courseIds: courses.map((course) => course.data.id),
                    parentId: parent.id,
                },
            };
            const nextState = Object.assign({}, state, newHome);
            return nextState;
        default:
            return state;
    }
};

const courses = (state = {}, action) => {
    switch (action.type) {
        case ADDED_COURSE_PAGE:
            const { id, meta, title, data, lessons } = action.course;
            const { type, parent } = meta;
            const { slug } = data;
            const newCourse = {
                [id]: {
                    id,
                    type,
                    title,
                    slug,
                    parentId: parent.id,
                    lessonIds: lessons.map((lesson) => lesson.id),
                },
            };
            const nextState = Object.assign({}, state, newCourse);
            return nextState;
        default:
            return state;
    }
};

const lessons = (state = {}, action) => {
    switch (action.type) {
        case ADDED_LESSON_PAGE:
            const { id, meta, title, data, objectives, content, test } = action.lesson;
            const { type, parent } = meta;
            const { slug, description, long_description, duration, coming_soon } = data;
            const newLesson = {
                [id]: {
                    id,
                    type,
                    title,
                    slug,
                    short_description: description,
                    long_description,
                    duration,
                    coming_soon,
                    objectives,
                    content,
                    test,
                    parentId: parent.id,
                },
            };
            const nextState = Object.assign({}, state, newLesson);
            return nextState;
        default:
            return state;
    }
};

const initialFetchStatus = {
    fetchingManifest: false,
}
const fetchStatus = (state = initialFetchStatus, action) => {
    switch (action.type) {
        case FETCHING_MANIFEST:
            const newState = Object.assign(state, {fetchingManifest: action.fetching});
            return newState;
        default:
            return state;
    }
}

// EXPORTED REDUCER
export default {
    fetchStatus,
    manifest,
    pages,
    home,
    courses,
    lessons,
};
