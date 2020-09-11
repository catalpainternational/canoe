import { storeCompletion, getCompletions } from "Actions/actions_store";

import { setComplete, isComplete, clearInMemoryCompletions } from "Actions/completion";

jest.mock("Actions/actions_store");

const COURSE_SLUG = "test-course";
const LESSON_SLUGS = ["test-lesson-1", "test-lesson-2", "test-lesson-3"];

describe("Tests completion methods.", () => {
    beforeEach(() => {
        return clearInMemoryCompletions();
    });

    test.each("setComplete() adds entry to IndexedDB", () => {
        const course = COURSE_SLUG;
        const lesson = LESSON_SLUGS[0];
        const section = "objective";
        setComplete(course, lesson, section);

        expect(storeCompletion).toHaveBeenCalledTimes(1);
        expect(storeCompletion).toHaveBeenCalledWith({
            course,
            lesson,
            section,
        });
        expect(isComplete(course, lesson, section)).toBeTruthy();
    });

    test.only.each`
        lessonSlug
        ${LESSON_SLUGS[0]}
        ${LESSON_SLUGS[1]}
        ${LESSON_SLUGS[2]}
    `(
        'setComplete("$lessonSlug") corresponds to a truthy isComplete("$lessonSlug").',
        ({ lessonSlug }) => {
            const course = COURSE_SLUG;
            const lesson = lessonSlug;
            const section = "objective";
            setComplete(course, lesson, section);

            for (const possibleLessonSlug of LESSON_SLUGS) {
                if (possibleLessonSlug === lesson) {
                    expect(isComplete(course, possibleLessonSlug, section)).toBe(true);
                } else {
                    expect(isComplete(course, possibleLessonSlug, section)).toBe(false);
                }
            }
        }
    );
});
