import { Page } from "../Page";
import TeachingTopic from "./TeachingTopic";

export default class TeachingActivity extends Page {
    get topic(): TeachingTopic {
        return this.parent as TeachingTopic;
    }

    get description(): string {
        return this.storedData?.description || "";
    }

    get plan(): any {
        return this.storedData?.plan || {};
    }

    get teach(): any {
        return this.storedData?.teach || {};
    }

    get extend(): any {
        return this.storedData?.extend || {};
    }

    get curriculum(): string {
        return this.storedData?.curriculum_id || "";
    }
}
