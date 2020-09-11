import { storeCompletion, getCompletions } from "Actions/actions_store";

import {
    setComplete,
    isComplete,
    pullCompletionsIntoMemory,
    clearInMemoryCompletions,
    getLatestCompletionInCourse,
} from "Actions/completion";

jest.mock("Actions/actions_store");

const COURSE_SLUG = "test-course";
const LESSON_SLUGS = ["test-lesson-1", "test-lesson-2", "test-lesson-3"];

const OBJECTIVES = "objectives";
const CONTENT = "content";
const TEST = "test";

const SAMPLE_COMPLETIONS = [
    {
        course: COURSE_SLUG,
        lesson: LESSON_SLUGS[0],
        section: OBJECTIVES,
        date: new Date("2020-9-3"),
    },
    { course: COURSE_SLUG, lesson: LESSON_SLUGS[0], section: CONTENT, date: new Date("2020-9-4") },
    { course: COURSE_SLUG, lesson: LESSON_SLUGS[0], section: TEST, date: new Date("2020-9-5") },
    {
        course: COURSE_SLUG,
        lesson: LESSON_SLUGS[1],
        section: OBJECTIVES,
        date: new Date("2020-9-6"),
    },
    { course: COURSE_SLUG, lesson: LESSON_SLUGS[1], section: CONTENT, date: new Date("2020-9-7") },
];

describe("Tests completion methods. Mocks indexedDB.", () => {
    beforeEach(() => {
        return clearInMemoryCompletions();
    });

    test("setComplete() adds entry to IndexedDB", () => {
        const course = COURSE_SLUG;
        const lesson = LESSON_SLUGS[0];
        const section = OBJECTIVES;
        setComplete(course, lesson, section);

        expect(storeCompletion).toHaveBeenCalledTimes(1);
        expect(storeCompletion).toHaveBeenCalledWith({
            course,
            lesson,
            section,
        });
        expect(isComplete(course, lesson, section)).toBeTruthy();
    });

    test.each`
        lessonSlug
        ${LESSON_SLUGS[0]}
        ${LESSON_SLUGS[1]}
        ${LESSON_SLUGS[2]}
    `(
        'setComplete("$lessonSlug") corresponds to a truthy isComplete("$lessonSlug").',
        ({ lessonSlug }) => {
            const course = COURSE_SLUG;
            const lesson = lessonSlug;
            const section = OBJECTIVES;
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

    test("pullCompletionsIntoMemory() restores completion data; clearInMemoryCompletions() deletes it.", async () => {
        getCompletions.mockReturnValue(SAMPLE_COMPLETIONS);

        await pullCompletionsIntoMemory();
        expect(getCompletions).toHaveBeenCalledTimes(1);

        for (const completion of SAMPLE_COMPLETIONS) {
            const { course, lesson, section } = completion;
            expect(isComplete(course, lesson, section)).toBeTruthy();
        }

        clearInMemoryCompletions();

        for (const completion of SAMPLE_COMPLETIONS) {
            const { course, lesson, section } = completion;
            expect(isComplete(course, lesson, section)).toBeFalsy();
        }
    });

    test("Without completions, getLatestCompletionInCourse() returns null. Otherwise, returns the latest completion.", () => {
        expect(getLatestCompletionInCourse()).toBeNull();

        for (const completion of SAMPLE_COMPLETIONS) {
            const { course, lesson, section, date } = completion;
            setComplete(course, lesson, section, {}, date);
        }

        const lastCompletion = SAMPLE_COMPLETIONS[SAMPLE_COMPLETIONS.length - 1];

        const { course, lesson, section } = lastCompletion;
        expect(getLatestCompletionInCourse(COURSE_SLUG, LESSON_SLUGS)).toMatchObject({
            courseSlug: course,
            lessonSlug: lesson,
            sectionSlug: section,
        });
    });
});
