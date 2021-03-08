import { Page } from "../Page";

export default class LearningActivityTopic extends Page {
    get resources(): Page[] {
        return this.childPages;
    }
}
