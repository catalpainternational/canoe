import { Page } from "../Page";

export default class LearningActivity extends Page {
    get resources(): Page[] {
        return this.childPages;
    }
}
