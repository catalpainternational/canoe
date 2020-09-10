import courseWithExam from "./pageData/courseWithExam";
import courseWithoutExam from "./pageData/courseWithoutExam";

import CoursePage from "js/CoursePage";
import ExamGrader from "js/ExamGrader";

import { getFinishedLessonSlugs, getLatestCompletionInCourse } from "Actions/completion";
import { hasUserTriedExam as hasTriedExam, getExamHighScore as getHighScore } from "Actions/exam";
import { _getOrFetchWagtailPageById } from "js/WagtailPagesAPI";

jest.mock("Actions/completion");
jest.mock("js/ExamGrader");
jest.mock("Actions/exam");
jest.mock("js/WagtailPagesAPI");

describe("Tests CoursePage's properties.", () => {
    test.each([courseWithExam, courseWithoutExam])(
        "CoursePage.id matches JSON's id.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);
            expect(cp.id).toBe(courseJSON.id);
        }
    );

    test.each([courseWithExam, courseWithoutExam])(
        "CoursePage.title matches JSON's title.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);
            expect(cp.title).toBe(courseJSON.title);
        }
    );

    test.each([courseWithExam, courseWithoutExam])(
        "CoursePage.slug matches JSON's slug.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);
            expect(cp.slug).toBe(courseJSON.meta.slug);
        }
    );

    test.each([courseWithExam, courseWithoutExam])(
        "CoursePage.lessons matches JSON's lessons.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);

            expect(cp.lessons.length).toBe(courseJSON.lessons.length);
            expect(cp.lessons).toEqual(courseJSON.lessons);
        }
    );

    test.each([courseWithExam, courseWithoutExam])(
        "CoursePage.numberOfLessons matches lesson and exam count.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);

            expect(cp.numberOfLessons).toBe(cp.lessons.length + Number(cp.hasExam()));
            expect(cp.numberOfLessons).toBe(courseJSON.data.lessons_count);
        }
    );

    test.each([courseWithExam, courseWithoutExam])(
        "CoursePage.numberOfFinishedLessons matches finished lesson and exam count.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);

            const MOCK_LESSON_SLUGS = ["slug-1", "slug-2"];
            getFinishedLessonSlugs.mockReturnValue(MOCK_LESSON_SLUGS);
            expect(cp.numberOfFinishedLessons).toBe(MOCK_LESSON_SLUGS.length);
        }
    );

    test.each([courseWithExam, courseWithoutExam])(
        "CoursePage.tags matches JSON's tags.",
        (courseJSON) => {
            const cp = new CoursePage(courseJSON);

            expect(cp.tags.length).toBe(courseJSON.tags.length);
            expect(cp.tags).toEqual(courseJSON.tags);
        }
    );

    test.each([courseWithExam, courseWithoutExam])(
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
        [courseWithoutExam, false],
    ])("CoursePage.hasExam() reflects whether course has an exam.", (courseJSON, expected) => {
        const cp = new CoursePage(courseJSON);
        expect(cp.hasExam()).toBe(expected);
    });

    test.each([
        [courseWithExam, true],
        [courseWithoutExam, false],
    ])(
        "CoursePage.isExamFinished() reflects whether course exam is finished.",
        (courseJSON, expected) => {
            ExamGrader.isExamFinished.mockReturnValue(expected);

            const cp = new CoursePage(courseJSON);
            expect(cp.isExamFinished()).toBe(expected);
        }
    );

    test.each([
        [courseWithExam, true],
        [courseWithoutExam, false],
    ])(
        "CoursePage.hasUserTriedExam() reflects whether course exam was tried.",
        (courseJSON, expected) => {
            hasTriedExam.mockReturnValue(expected);

            const cp = new CoursePage(courseJSON);
            expect(cp.hasUserTriedExam()).toBe(expected);
        }
    );

    test.each([
        [courseWithExam, 99],
        [courseWithoutExam, 0],
    ])("CoursePage.getExamHighScore() gives exam's high score.", (courseJSON, expected) => {
        getHighScore.mockReturnValue(expected);

        const cp = new CoursePage(courseJSON);
        expect(cp.getExamHighScore()).toBe(expected);
    });

    test.each`
        courseJSON           | finishedLessons                             | expected
        ${courseWithExam}    | ${["slug-1", "slug-2", "exam"]}             | ${true}
        ${courseWithoutExam} | ${["slug-1", "slug-2", "slug-3", "slug-4"]} | ${true}
        ${courseWithExam}    | ${["slug-1", "slug-2"]}                     | ${false}
        ${courseWithoutExam} | ${["slug-1", "slug-2", "slug-3"]}           | ${false}
    `(
        "With $courseJSON.data.lessons_count total lessons and $finishedLessons.length finished lessons, CoursePage.isFinished() returns $expected.",
        ({ courseJSON, finishedLessons, expected }) => {
            getFinishedLessonSlugs.mockReturnValue(finishedLessons);

            const cp = new CoursePage(courseJSON);
            expect(cp.isFinished()).toBe(expected);
        }
    );

    test.each`
        courseJSON           | expected
        ${courseWithExam}    | ${{ courseSlug: "course-1", lessonSlug: "lesson-1", sectionSlug: "test", completionDate: new Date() }}
        ${courseWithoutExam} | ${{ courseSlug: "course-1", lessonSlug: "lesson-1", sectionSlug: "test", completionDate: new Date() }}
    `("CoursePage.getLatestCompletion() returns completion data.", ({ courseJSON, expected }) => {
        getLatestCompletionInCourse.mockReturnValue(expected);

        const cp = new CoursePage(courseJSON);
        expect(cp.getLatestCompletion()).toBe(expected);
    });

    test.each`
        courseJSON           | expected
        ${courseWithExam}    | ${true}
        ${courseWithoutExam} | ${false}
    `("CoursePage.isVisibleToGuests() returns $expected.", ({ courseJSON, expected }) => {
        const cp = new CoursePage(courseJSON);
        expect(cp.isVisibleToGuests()).toBe(expected);
    });

    test.each`
        courseJSON           | lessonJSON
        ${courseWithExam}    | ${{ id: 50, data: { slug: "test-lesson" } }}
        ${courseWithoutExam} | ${{ id: 50, data: { slug: "test-lesson" } }}
    `(
        "CoursePage.getFullLessonObjects() returns correct Array of LessonPages.",
        async ({ courseJSON, lessonJSON }) => {
            _getOrFetchWagtailPageById.mockReturnValue(lessonJSON);

            const cp = new CoursePage(courseJSON);
            const lessons = await cp.getFullLessonObjects();
            for (const lesson of lessons) {
                expect(lesson.id).toBe(50);
                expect(lesson.slug).toBe("test-lesson");
            }
        }
    );
});
