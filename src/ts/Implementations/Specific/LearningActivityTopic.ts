import { Page } from "../Page";

export default class LearningActivityTopic extends Page {
    get activities(): Page[] {
        return this.childPages;
    }
}
