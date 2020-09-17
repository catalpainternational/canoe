import { _getOrFetchWagtailPageById } from "js/WagtailPagesAPI";
import CoursePage from "./CoursePage";

export default class HomePage {
    constructor(aWagtailPage) {
        this.home = aWagtailPage;
    }

    get courses() {
        return this.home.courses;
    }

    async getFullCourseObjects() {
        const courseIds = this.courses.map((course) => course.data.id);
        const courses = [];
        for (const courseId of courseIds) {
            const courseJSON = await _getOrFetchWagtailPageById(courseId);
            courses.push(new CoursePage(courseJSON));
        }
        return courses;
    }
}
