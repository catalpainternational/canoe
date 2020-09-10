import CourseWithExamJSON from "./pageData/courseWithExam";
import ExamlessCourseJSON from "./pageData/courseWithoutExam";

import CoursePage from "js/CoursePage";

import { countCompleteLessonsInCourses } from "js/CompletionInterface";
import courseWithExam from "./pageData/courseWithExam";

jest.mock("js/CompletionInterface");

describe("Tests CoursePage's properties.", () => {
    test("CoursePage.id matches JSON's id.", () => {
        const cp = new CoursePage(CourseWithExamJSON);
        expect(cp.id).toBe(CourseWithExamJSON.id);
    });

    test("CoursePage.title matches JSON's title.", () => {
        const cp = new CoursePage(CourseWithExamJSON);
        expect(cp.title).toBe(CourseWithExamJSON.title);
    });

    test("CoursePage.slug matches JSON's slug.", () => {
        const cp = new CoursePage(CourseWithExamJSON);
        expect(cp.slug).toBe(CourseWithExamJSON.meta.slug);
    });

    test("CoursePage.lessons matches JSON's lessons.", () => {
        const cp = new CoursePage(CourseWithExamJSON);

        expect(cp.lessons.length).toBe(CourseWithExamJSON.lessons.length);
        expect(cp.lessons).toEqual(CourseWithExamJSON.lessons);
    });

    test("CoursePage.numberOfLessons matches lesson and exam count.", () => {
        const cp = new CoursePage(CourseWithExamJSON);

        expect(cp.numberOfLessons).toBe(cp.lessons.length + Number(cp.hasExam()));
        expect(cp.numberOfLessons).toBe(CourseWithExamJSON.data.lessons_count);
    });

    test("CoursePage.numberOfFinishedLessons matches finished lesson and exam count.", () => {
        const cp = new CoursePage(CourseWithExamJSON);

        const MOCK_COMPLETION_VALUE = 200;
        countCompleteLessonsInCourses.mockReturnValue(MOCK_COMPLETION_VALUE);
        expect(cp.numberOfFinishedLessons).toBe(MOCK_COMPLETION_VALUE);
    });

    test("CoursePage.tags matches JSON's tags.", () => {
        const cp = new CoursePage(CourseWithExamJSON);

        expect(cp.tags.length).toBe(CourseWithExamJSON.tags.length);
        expect(cp.tags).toEqual(CourseWithExamJSON.tags);
    });

    test("CoursePage.exam matches JSON's exam.", () => {
        const cp = new CoursePage(CourseWithExamJSON);

        expect(cp.exam.length).toBe(CourseWithExamJSON.exam.length);
        expect(cp.exam).toEqual(CourseWithExamJSON.exam);
    });
});

describe("Tests CoursePage's methods.", () => {
    test.each([
        [courseWithExam, true],
        [ExamlessCourseJSON, false],
    ])("CoursePage.hasExam() reflects whether course has an exam.", (courseJSON, expected) => {
        const cp = new CoursePage(courseJSON);
        expect(cp.hasExam()).toBe(expected);
    });
});
