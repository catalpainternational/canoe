import { Page } from "../Page";

export default class ResourcesRootPage extends Page {
    get resources(): Page[] {
        return this.childPages;
    }
}
