import { Page } from "../Page";

export default class Resource extends Page {
    get description(): string {
        return "";
    }

    get tags(): string[] {
        return [];
    }

    get cards(): any {
        return this.data.cards.cards;
    }
}