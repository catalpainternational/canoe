/* Completion module
 * The access point for interface components to set and query completion
 * of content items.
 * All interface methods should be syncronous.
 * Depends on the action_store module to persist information
 */

import { storeCompletion, getCompletions } from "./actions_store";
import { ON_ACTION_CHANGE, ON_COMPLETION_CHANGE } from "js/Events";
import { intersection } from "js/SetMethods";

const courses = new Map();

// read completion actions from idb to update in memory values
window.addEventListener(ON_ACTION_CHANGE, initialiseCompletions);

export const clearInMemoryCompletions = () => {
    courses.clear();
};

// read completions from store and initialise
export async function initialiseCompletions() {
    try {
        const actions = await getCompletions();
        actions.forEach((action) => {
            setCompleteInternal(action.course, action.lesson, action.section, action.date);
        });
        window.dispatchEvent(new CustomEvent(ON_COMPLETION_CHANGE));
    } catch (e) {
        console.error(err);
    }
}

export function setComplete(course, lesson, section) {
    setCompleteInternal(course, lesson, section, new Date());

    // store the action ( via idb and api )
    storeCompletion({ course, lesson, section });
}

function setCompleteInternal(course, lesson, section, date) {
    const courseMap = getCourseMap(course);
    const lessonMap = getLessonMap(courseMap, lesson);
    lessonMap.set(section, date);
}

const isLaterThanCutoff = (completion) => {
    if (!completion) {
        return false;
    }
    const dateString = `${process.env.DONT_SHOW_COMPLETIONS_AFTER}`;
    const dontShowActionsFromBeforeThisDate = new Date(dateString);
    return completion >= dontShowActionsFromBeforeThisDate;
};

function isLessonComplete(lessonMap) {
    const objectiveCompletion = lessonMap.get("objectives");
    const contentCompletion = lessonMap.get("content");
    const testCompletion = lessonMap.get("test");

    return (
        isLaterThanCutoff(objectiveCompletion) &&
        isLaterThanCutoff(contentCompletion) &&
        isLaterThanCutoff(testCompletion)
    );
}

function getCourseMap(course) {
    if (!courses.has(course)) {
        courses.set(course, new Map());
    }
    return courses.get(course);
}

function getLessonMap(courseMap, lesson) {
    if (!courseMap.has(lesson)) {
        courseMap.set(lesson, new Map());
    }
    return courseMap.get(lesson);
}

export function isComplete(course, lesson, section) {
    const courseMap = getCourseMap(course);
    const lessonMap = getLessonMap(courseMap, lesson);
    if (section) {
        const sectionCompletion = lessonMap.get(section);
        return isLaterThanCutoff(sectionCompletion);
    } else {
        return isLessonComplete(lessonMap);
    }
}

export const isTheCourseComplete = (courseSlug, lessonSlugs) => {
    const numberOfCompleteLessons = countCompleteLessonsInCourse(courseSlug, lessonSlugs);
    const numberOfLessonsInCourse = lessonSlugs.length;
    return numberOfCompleteLessons === numberOfLessonsInCourse;
};

export const countCompleteLessonsInCourse = (courseSlug, lessonSlugs) => {
    const courseMap = getCourseMap(courseSlug);
    const lessonsInCourseMap = new Set(courseMap.keys());
    const liveLessons = new Set(lessonSlugs);
    const liveLessonsInCourseMap = intersection(lessonsInCourseMap, liveLessons);

    let numCompletedLessons = 0;
    for (const lessonSlug of liveLessonsInCourseMap) {
        const lessonCompletion = courseMap.get(lessonSlug);
        if (isLessonComplete(lessonCompletion)) {
            numCompletedLessons += 1;
        }
    }
    return numCompletedLessons;
};

export const getLatestCompletionInCourse = (courseSlug) => {
    const courseMap = courses.get(courseSlug);
    let latest = null;
    for (const [lessonSlug, lessonMap] of courseMap.entries()) {
        for (const [sectionSlug, completionDate] of lessonMap.entries()) {
            if (latest === null || latest.completionDate < completionDate) {
                latest = { courseSlug, lessonSlug, sectionSlug, completionDate };
            }
        }
    }
    return latest;
};

export const getLatestInCompletionArray = (completionArray) => {
    let latest = null;
    for (const completion of completionArray) {
        if (!latest || completion.completionDate > latest) {
            latest = completion;
        }
    }
    return latest;
};
