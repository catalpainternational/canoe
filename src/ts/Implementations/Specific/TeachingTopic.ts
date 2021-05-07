import { Page } from "../Page";

export default class TeachingTopic extends Page {
    get activities(): Page[] {
        return this.childPages;
    }

    get description(): string {
        return this.data.description;
    }
    get completionData(): Record<string, any> {
        return {
            pageType: "topic",
        };
    }
}
