import { Page } from "../Page";

export default class ResourcesRoot extends Page {
    #all_tags!: Set<string>;

    get resources(): Page[] {
        return this.childPages;
    }

    get all_tags(): Set<string> {
        if (this.#all_tags === undefined) {
            this.#all_tags = new Set(
                this.resources
                    .map((r: any) => r.tags)
                    .flat()
                    .map((tag: string) => tag.toLowerCase())
            );
        }
        return this.#all_tags;
    }
}
