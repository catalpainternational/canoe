import { Page } from "../Page";
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

    get curriculum(): string {
        return this.data.curriculum_id;
    }
}
