import lessonJSON from "./pageData/lesson";

import LessonPage from "js/LessonPage";

//import { isComplete } from "js/actions/completion";
import { _getOrFetchWagtailPageById } from "js/WagtailPagesAPI";

// Because AVA runs tests concurrently it does not group their output like Mocha or Jest

// Test ResourceArticle's properties.

// jest.mock("Actions/completion");
// jest.mock("js/WagtailPagesAPI");

// Test LessonPage's properties.
test("LessonPage properties: LessonPage's id matches lesson JSON's id.", (t) => {
    const lp = new LessonPage(lessonJSON);
    t.is(lp.id, lessonJSON.id);
});
test("LessonPage properties: LessonPage's title matches lesson JSON's title.", (t) => {
    const lp = new LessonPage(lessonJSON);
    t.is(lp.title, lessonJSON.title);
});
test("LessonPage properties: LessonPage's slug matches lesson JSON's slug.", (t) => {
    const lp = new LessonPage(lessonJSON);
    t.is(lp.slug, lessonJSON.slug);
});
test("LessonPage properties: LessonPage's course matches lesson JSON's course.", (t) => {
    const lp = new LessonPage(lessonJSON);
    t.deepEqual(lp.course, lessonJSON.course);
});
test("LessonPage properties: LessonPage's description matches lesson JSON's description.", (t) => {
    const lp = new LessonPage(lessonJSON);
    t.is(lp.description, lessonJSON.description);
});
test("LessonPage properties: LessonPage's longDescription matches lesson JSON's long_description.", (t) => {
    const lp = new LessonPage(lessonJSON);
    t.is(lp.longDescription, lessonJSON.long_description);
});
test("LessonPage properties: LessonPage's objective match lesson JSON's objective.", (t) => {
    const lp = new LessonPage(lessonJSON);
    t.deepEqual(lp.objective, lessonJSON.objective);
});
test("LessonPage properties: LessonPage's content match lesson JSON's content.", (t) => {
    const lp = new LessonPage(lessonJSON);
    t.deepEqual(lp.content, lessonJSON.content);
});
test("LessonPage properties: LessonPage's test match lesson JSON's test.", (t) => {
    const lp = new LessonPage(lessonJSON);
    t.deepEqual(lp.test, lessonJSON.test);
});

// describe("Tests LessonPage's methods.", () => {
//     test("LessonPage.getDuration() returns the sum of objective, content, and test's duration.", () => {
//         const lp = new LessonPage(lessonJSON);
//         expect(lp.getDuration()).toBe(
//             lessonJSON.objective.duration + lessonJSON.content.duration + lessonJSON.test.duration
//         );
//     });

//     test.each`
//         lesson                             | expected
//         ${lessonJSON}                      | ${false}
//         ${{ data: { coming_soon: true } }} | ${true}
//     `("LessonPage.isComingSoon() returns $expected", ({ lesson, expected }) => {
//         const lp = new LessonPage(lesson);
//         expect(lp.isComingSoon()).toBe(expected);
//     });

//     test.each`
//         mockIsComplete | expected
//         ${true}        | ${true}
//         ${false}       | ${false}
//     `("LessonPage.isFinished() returns $expected", ({ mockIsComplete, expected }) => {
//         isComplete.mockReturnValue(mockIsComplete);

//         const lp = new LessonPage(lessonJSON);
//         expect(lp.isFinished()).toBe(expected);
//     });

//     test("LessonPage.getFullCourseObject() returns the correct CoursePage object.", async () => {
//         const MOCK_COURSE_ID = 13;
//         const MOCK_COURSE_SLUG = "test-course";

//         _getOrFetchWagtailPageById.mockReturnValue({
//             id: MOCK_COURSE_ID,
//             data: { slug: MOCK_COURSE_SLUG },
//         });

//         const lp = new LessonPage(lessonJSON);
//         const course = await lp.getFullCourseObject();

//         expect(course.id).toBe(MOCK_COURSE_ID);
//         expect(course.slug).toBe(MOCK_COURSE_SLUG);
//     });
// });
