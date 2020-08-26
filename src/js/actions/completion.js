/* Completion module
 * The access point for interface components to set and query completion
 * of content items.
 * All interface methods should be synchronous.
 * Depends on the action_store module to persist information
 */

import { storeCompletion, getCompletions } from "./actions_store";
import { ON_ACTION_CHANGE, ON_COMPLETION_CHANGE } from "js/Events";
import { intersection } from "js/SetMethods";

const courses = new Map();

// read completion actions from idb to update in memory values
window.addEventListener(ON_ACTION_CHANGE, pullCompletionsIntoMemory);

export const clearInMemoryCompletions = () => {
    courses.clear();
};

// read completions from store and initialise
export async function pullCompletionsIntoMemory() {
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

export function setComplete(course, lesson, section, extraDataObject = {}) {
    setCompleteInternal(course, lesson, section, new Date());

    // store the action ( via idb and api )
    storeCompletion({ course, lesson, section, ...extraDataObject });
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
    const numberOfCompleteLessons = getFinishedLessonSlugs(courseSlug, lessonSlugs).length;
    const numberOfLessonsInCourse = lessonSlugs.length;
    return numberOfCompleteLessons === numberOfLessonsInCourse;
};

export const getFinishedLessonSlugs = (courseSlug, liveLessonSlugs) => {
    const courseMap = getCourseMap(courseSlug);
    const lessonsInCourseMap = new Set(courseMap.keys());
    const liveLessons = new Set(liveLessonSlugs);
    const liveLessonsInCourseMap = intersection(lessonsInCourseMap, liveLessons);

    const finishedLessons = [];
    for (const lessonSlug of liveLessonsInCourseMap) {
        const lessonMap = courseMap.get(lessonSlug);
        const isExamComplete = () => isComplete(courseSlug, lessonSlug, lessonSlug);
        if (isLessonComplete(lessonMap) || isExamComplete()) {
            finishedLessons.push(lessonSlug);
        }
    }
    return finishedLessons;
};

export const getLatestCompletionInCourse = (courseSlug) => {
    let latest = null;
    if (!courses.has(courseSlug)) {
        return latest;
    }

    const courseMap = courses.get(courseSlug);
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
