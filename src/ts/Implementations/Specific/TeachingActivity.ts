import { Page } from "../Page";
import { TWagtailPage } from "../../Types/PageTypes";
import TeachingTopic from "./TeachingTopic";

export default class TeachingActivity extends Page {
    get topic(): TeachingTopic {
        return this.parent as TeachingTopic;
    }

    get description(): string {
        return this.data.description;
    }

    get plan(): any {
        return this.data.plan;
    }

    get teach(): any {
        return this.data.teach;
    }

    get extend(): any {
        return this.data.extend;
    }

    get plan_tips(): TWagtailPage | undefined {
        return this.plan.tips_page
            ? this.manifest.pages[this.plan.tips_page]
            : undefined;
    }

    get teach_tips(): TWagtailPage | undefined {
        return this.teach.tips_page
            ? this.manifest.pages[this.teach.tips_page]
            : undefined;
    }

    get curriculum(): string {
        return this.data.curriculum_id;
    }

    get completionData(): Record<string, any> {
        return {
            pageType: "activity",
        };
    }

    get complete(): boolean {
        return super.complete;
    }
    set complete(complete: boolean) {
        super.complete = complete;
        const topicCompelte = this.topic.childPages.every((c) => c.complete);
        if (this.topic.complete !== topicCompelte) {
            this.topic.complete = topicCompelte;
        }
    }
}
