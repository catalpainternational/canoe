import { Page } from "../Page";
import TeachingTopic from "./TeachingTopic";

export default class TeachingActivity extends Page {
    get topic(): TeachingTopic {
        return this.parent as TeachingTopic;
    }

    get description(): string {
        return this.data.description;
    }
}
