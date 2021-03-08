import { Page } from "../Page";

export default class ResourcesRoot extends Page {
    get resources(): Page[] {
        return this.childPages;
    }
}
