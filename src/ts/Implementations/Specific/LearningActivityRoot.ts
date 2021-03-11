import { Page } from "../Page";

export default class LearningActivityRoot extends Page {
    #all_tags!: Set<string>;

    get topics(): Page[] {
        return this.childPages;
    }
    get all_tags(): Set<string> {
        if (this.#all_tags === undefined) {
            this.#all_tags = new Set(
                this.topics
                    .map((t: any) => t.tags)
                    .flat()
                    .map((tag: string) => tag.toLowerCase())
            );
        }
        return this.#all_tags;
    }
    get description(): string {
        return this.data.description;
    }
}
