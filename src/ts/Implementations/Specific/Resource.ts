import { Page } from "../Page";

export default class Resource extends Page {
    get description(): string {
        return this.manifestData.data?.description;
    }

    get cardTypes(): string[] {
        return this.manifestData.data?.card_types;
    }

    get cards(): any {
        return this.data.cards.cards;
    }
}
