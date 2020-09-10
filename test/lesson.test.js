import lessonJSON from "./pageData/lesson";

import LessonPage from "js/LessonPage";

import { isComplete } from "Actions/completion";
import { _getOrFetchWagtailPageById } from "js/WagtailPagesAPI";

jest.mock("Actions/completion");
jest.mock("js/WagtailPagesAPI");

describe("Tests LessonPage's properties.", () => {
    test("LessonPage.id matches lesson JSON's id.", () => {
        const lp = new LessonPage(lessonJSON);
        expect(lp.id).toBe(lessonJSON.id);
    });

    test("LessonPage.title matches lesson JSON's title.", () => {
        const lp = new LessonPage(lessonJSON);
        expect(lp.title).toBe(lessonJSON.title);
    });

    test("LessonPage.slug matches lesson JSON's slug.", () => {
        const lp = new LessonPage(lessonJSON);
        expect(lp.slug).toBe(lessonJSON.meta.slug);
    });

    test("LessonPage.course matches lesson JSON's course.", () => {
        const lp = new LessonPage(lessonJSON);
        expect(lp.course).toEqual(lessonJSON.course);
    });

    test("LessonPage.shortDescription matches lesson JSON's description.", () => {
        const lp = new LessonPage(lessonJSON);
        expect(lp.shortDescription).toBe(lessonJSON.data.description);
    });

    test("LessonPage.longDescription matches lesson JSON's long_description.", () => {
        const lp = new LessonPage(lessonJSON);
        expect(lp.longDescription).toBe(lessonJSON.data.long_description);
    });

    test("LessonPage.objective matches lesson JSON's objective.", () => {
        const lp = new LessonPage(lessonJSON);
        expect(lp.objective).toEqual(lessonJSON.objective);
    });

    test("LessonPage.content matches lesson JSON's content.", () => {
        const lp = new LessonPage(lessonJSON);
        expect(lp.content).toEqual(lessonJSON.content);
    });

    test("LessonPage.test matches lesson JSON's test.", () => {
        const lp = new LessonPage(lessonJSON);
        expect(lp.test).toEqual(lessonJSON.test);
    });
});

describe("Tests LessonPage's methods.", () => {
    test("LessonPage.getDuration() returns the sum of objective, content, and test's duration.", () => {
        const lp = new LessonPage(lessonJSON);
        expect(lp.getDuration()).toBe(
            lessonJSON.objective.duration + lessonJSON.content.duration + lessonJSON.test.duration
        );
    });

    test.each`
        lesson                             | expected
        ${lessonJSON}                      | ${false}
        ${{ data: { coming_soon: true } }} | ${true}
    `("LessonPage.isComingSoon() returns $expected", ({ lesson, expected }) => {
        const lp = new LessonPage(lesson);
        expect(lp.isComingSoon()).toBe(expected);
    });

    test.each`
        mockIsComplete | expected
        ${true}        | ${true}
        ${false}       | ${false}
    `("LessonPage.isFinished() returns $expected", ({ mockIsComplete, expected }) => {
        isComplete.mockReturnValue(mockIsComplete);

        const lp = new LessonPage(lessonJSON);
        expect(lp.isFinished()).toBe(expected);
    });

    test("LessonPage.getFullCourseObject() returns the correct CoursePage object.", async () => {
        const MOCK_COURSE_ID = 13;
        const MOCK_COURSE_SLUG = "test-course";

        _getOrFetchWagtailPageById.mockReturnValue({
            id: MOCK_COURSE_ID,
            data: { slug: MOCK_COURSE_SLUG },
        });

        const lp = new LessonPage(lessonJSON);
        const course = await lp.getFullCourseObject();

        expect(course.id).toBe(MOCK_COURSE_ID);
        expect(course.slug).toBe(MOCK_COURSE_SLUG);
    });
});
