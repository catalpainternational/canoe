import { Page } from "../Page";

export default class LearningActivityRoot extends Page {
    get resources(): Page[] {
        return this.childPages;
    }

    get description(): string {
        return this.data.description;
    }
}
