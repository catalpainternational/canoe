/*
    CompletionInterface inverts the dependency between Canoe and Actions/completion.
*/

import {
    pullCompletionsIntoMemory as pullCompletions,
    clearInMemoryCompletions as clearCompletions,
    getFinishedLessonSlugs,
} from "Actions/completion";

export const countFinishedLessonsAmongSlugs = (courseSlug, slugsOfLiveLessons) => {
    return getFinishedLessonSlugs(courseSlug, slugsOfLiveLessons).length;
};

export const clearInMemoryCompletions = () => {
    clearCompletions();
};

export const pullCompletionsIntoMemory = async () => {
    await pullCompletions();
};
