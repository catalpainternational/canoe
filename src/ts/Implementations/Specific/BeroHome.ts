import { Page } from "../Page";
// import AllCourses from "./AllCourses";

export default class BeroHome extends Page {
    get imageUrl(): string {
        return this.data.card_image;
    }

    get description(): string {
        return this.data.description;
    }

    // TODO should this be courses(): AllCourses ?
    get courses(): any {
        return this.manifest.getLanguagePageType(
            this.language,
            "courseshomepage"
        );
    }

    get learningActivities(): any {
        return this.manifest.getLanguagePageType(
            this.language,
            "learningactivitieshomepage"
        );
    }

    get resources(): any {
        return this.manifest.getLanguagePageType(
            this.language,
            "resourcesroot"
        );
    }

    // get courseCategories(): any {
    //     // TODO
    // }
}
