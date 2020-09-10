import homeJSON from "./pageData/home";

import HomePage from "js/HomePage";

import { _getOrFetchWagtailPageById } from "js/WagtailPagesAPI";

jest.mock("js/WagtailPagesAPI");

describe("Tests HomePage's properties.", () => {
    test("HomePage.courses matches JSON's courses.", () => {
        const hp = new HomePage(homeJSON);
        expect(hp.courses).toEqual(homeJSON.courses);
    });
});

describe("Tests HomePage's methods.", () => {
    test("HomePage.getFullCourseObjects returns correct Array of CoursePage objects.", async () => {
        const TEST_COURSE_ID = 13;
        const TEST_COURSE_SLUG = "test-course";

        const courseJSON = { id: TEST_COURSE_ID, data: { slug: TEST_COURSE_SLUG } };
        _getOrFetchWagtailPageById.mockReturnValue(courseJSON);

        const hp = new HomePage(homeJSON);
        const courses = await hp.getFullCourseObjects();
        for (const course of courses) {
            expect(course.id).toBe(TEST_COURSE_ID);
            expect(course.slug).toBe(TEST_COURSE_SLUG);
        }
    });
});
