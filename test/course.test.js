import CourseWithExamJSON from "./pageData/courseWithExam";
import courseWithoutExamJSON from "./pageData/courseWithoutExam";

import CoursePage from "js/CoursePage";

import { countCompleteLessonsInCourses } from "js/CompletionInterface";
import courseWithExam from "./pageData/courseWithExam";

jest.mock("js/CompletionInterface");

describe("Tests CoursePage's properties.", () => {
    test.each([courseWithExam, courseWithoutExamJSON])(
        "CoursePage.id matches JSON's id.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);
            expect(cp.id).toBe(courseJSON.id);
        }
    );

    test.each([courseWithExam, courseWithoutExamJSON])(
        "CoursePage.title matches JSON's title.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);
            expect(cp.title).toBe(courseJSON.title);
        }
    );

    test.each([courseWithExam, courseWithoutExamJSON])(
        "CoursePage.slug matches JSON's slug.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);
            expect(cp.slug).toBe(courseJSON.meta.slug);
        }
    );

    test.each([courseWithExam, courseWithoutExamJSON])(
        "CoursePage.lessons matches JSON's lessons.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);

            expect(cp.lessons.length).toBe(courseJSON.lessons.length);
            expect(cp.lessons).toEqual(courseJSON.lessons);
        }
    );

    test.each([courseWithExam, courseWithoutExamJSON])(
        "CoursePage.numberOfLessons matches lesson and exam count.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);

            expect(cp.numberOfLessons).toBe(cp.lessons.length + Number(cp.hasExam()));
            expect(cp.numberOfLessons).toBe(courseJSON.data.lessons_count);
        }
    );

    test.each([courseWithExam, courseWithoutExamJSON])(
        "CoursePage.numberOfFinishedLessons matches finished lesson and exam count.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);

            const MOCK_COMPLETION_VALUE = 200;
            countCompleteLessonsInCourses.mockReturnValue(MOCK_COMPLETION_VALUE);
            expect(cp.numberOfFinishedLessons).toBe(MOCK_COMPLETION_VALUE);
        }
    );

    test.each([courseWithExam, courseWithoutExamJSON])(
        "CoursePage.tags matches JSON's tags.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);

            expect(cp.tags.length).toBe(courseJSON.tags.length);
            expect(cp.tags).toEqual(courseJSON.tags);
        }
    );

    test.each([courseWithExam, courseWithoutExamJSON])(
        "CoursePage.exam matches JSON's exam.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);

            expect(cp.exam.length).toBe(courseJSON.exam.length);
            expect(cp.exam).toEqual(courseJSON.exam);
        }
    );
});

describe("Tests CoursePage's methods.", () => {
    test.each([
        [courseWithExam, true],
        [courseWithoutExamJSON, false],
    ])("CoursePage.hasExam() reflects whether course has an exam.", (courseJSON, expected) => {
        const cp = new CoursePage(courseJSON);
        expect(cp.hasExam()).toBe(expected);
    });
});
