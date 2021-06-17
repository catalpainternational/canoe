import { Page } from "../Page";
// import Course from "./Course";
// import AllCourses from "./AllCourses";

export default class BeroHome extends Page {
    // get courses(): any {
    //     return this.childPages;
    // }

    get imageUrl(): string {
        return this.data.card_image;
    }

    get description(): string {
        return this.data.description;
    }

    // get coursesHomePage(): AllCourses {
    //     console.log(this);
    //
    //     return this.data;
    // }
}
