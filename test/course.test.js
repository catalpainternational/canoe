import TestCourseJSON from "./pageData/course";

import CoursePage from "js/CoursePage";

import { countCompleteLessonsInCourses } from "js/CompletionInterface";

jest.mock("countCompleteLessonsInCourses");

describe("Tests CoursePage's properties.", () => {
    test("CoursePage.id matches JSON's id.", () => {
        const cp = new CoursePage(TestCourseJSON);
        expect(cp.id).toBe(TestCourseJSON.id);
    });

    test("CoursePage.title matches JSON's title.", () => {
        const cp = new CoursePage(TestCourseJSON);
        expect(cp.title).toBe(TestCourseJSON.title);
    });

    test("CoursePage.slug matches JSON's slug.", () => {
        const cp = new CoursePage(TestCourseJSON);
        expect(cp.slug).toBe(TestCourseJSON.meta.slug);
    });

    test("CoursePage.lessons matches JSON's lessons.", () => {
        const cp = new CoursePage(TestCourseJSON);

        expect(cp.lessons.length).toBe(TestCourseJSON.lessons.length);
        expect(cp.lessons).toEqual(TestCourseJSON.lessons);
    });

    test("CoursePage.numberOfLessons matches lesson and exam count.", () => {
        const cp = new CoursePage(TestCourseJSON);

        expect(cp.numberOfLessons).toBe(cp.lessons.length + Number(cp.hasExam()));
        expect(cp.numberOfLessons).toBe(TestCourseJSON.data.lessons_count);
    });

    test("CoursePage.numberOfFinishedLessons matches finished lesson and exam count.", () => {
        const cp = new CoursePage(TestCourseJSON);

        expect(cp.numberOfLessons).toBe(cp.lessons.length + Number(cp.hasExam()));
        expect(cp.numberOfLessons).toBe(TestCourseJSON.data.lessons_count);
    });

    test("CoursePage.tags matches JSON's tags.", () => {
        const cp = new CoursePage(TestCourseJSON);

        expect(cp.tags.length).toBe(TestCourseJSON.tags.length);
        expect(cp.tags).toEqual(TestCourseJSON.tags);
    });

    test("CoursePage.exam matches JSON's exam.", () => {
        const cp = new CoursePage(TestCourseJSON);

        expect(cp.exam.length).toBe(TestCourseJSON.exam.length);
        expect(cp.exam).toEqual(TestCourseJSON.exam);
    });
});
