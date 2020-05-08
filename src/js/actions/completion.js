/* Completion module
 * The access point for interface components to set and query completion
 * of content items.
 * All interface methods should be syncronous.
 * Depends on the action_store module to persist information
 */

import { storeCompletion, getCompletions } from "./actions_store";
import { ON_ACTION_CHANGE, ON_COMPLETION_CHANGE } from "js/Events";
import { intersection } from "js/SetMethods";
import { getLanguage } from "ReduxImpl/Store";

const courses = new Map();

// read completion actions from idb to update in memory values
window.addEventListener(ON_ACTION_CHANGE, initialiseCompletions);

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

export function countComplete(courseSlug) {
    const courseMap = getCourseMap(courseSlug);
    let numCompletedLessons = 0;
    for (const lessonMap of courseMap.values()) {
        if (isLessonComplete(lessonMap)) {
            numCompletedLessons += 1;
        }
    }
    return numCompletedLessons;
}

export const countNumberOfCompleteLessons = (courseSlug, lessonSlugs) => {
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

export const isTheCourseCompleteNew = (courseSlug, lessonSlugs) => {
    const numberOfCompleteLessons = countNumberOfCompleteLessons(courseSlug, lessonSlugs);
    const numberOfLessons = lessonSlugs.length;
    return numberOfCompleteLessons === numberOfLessons
};

export const isTheCourseComplete = (courseSlug, coursesLessons) => {
    const numberOfCoursesCompletions = countComplete(courseSlug);
    const numberOfCoursesLessons = coursesLessons.size || coursesLessons.length;
    return numberOfCoursesCompletions === numberOfCoursesLessons;
};

const isCourseInTheCurrentLanguage = (courseSlug) => {
    const currentLanguage = getLanguage();
    if (currentLanguage === "en") {
        return !courseSlug.includes("tdt");
    } else {
        return courseSlug.includes("tdt");
    }
};

export function getMostRecentCompletion() {
    let latest = null;

    for (const [courseSlug, courseMap] of courses.entries()) {
        if (isTheCourseComplete(courseSlug, courseMap)) {
            continue;
        }
        if (!isCourseInTheCurrentLanguage(courseSlug)) {
            continue;
        }

        for (const [lessonSlug, lessonMap] of courseMap.entries()) {
            for (const [sectionSlug, completionDate] of lessonMap.entries()) {
                if (latest === null || latest.completionDate < completionDate) {
                    latest = { courseSlug, lessonSlug, sectionSlug, completionDate };
                }
            }
        }
    }
    return latest;
}
