import { Page } from "../Page";

export default class LearningTopic extends Page {
    get activities(): Page[] {
        return this.childPages;
    }

    get description(): string {
        return this.data.description;
    }
}
