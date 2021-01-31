import { Page } from "../Page";

export default class LessonPage extends Page {
    isFinished(): boolean {
        return false;
    }
    isComingSoon(): boolean {
        return false;
    }
}
