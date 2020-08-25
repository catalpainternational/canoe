export default class LessonPage {
    constructor(aWagtailPage) {
        this.lesson = aWagtailPage;
    }

    get json() {
        return this.lesson;
    }

    get id() {
        return this.lesson.id;
    }

    get title() {
        return this.lesson.title;
    }

    get slug() {
        return this.lesson.data.slug;
    }

    get course() {
        return this.lesson.course;
    }

    get shortDescription() {
        return this.lesson.data.description;
    }

    get longDescription() {
        return this.lesson.data.long_description;
    }

    get objective() {
        return this.lesson.objective;
    }

    get content() {
        return this.lesson.content;
    }

    get test() {
        return this.lesson.test;
    }

    getDuration() {
        return this.objective.duration + this.content.duration + this.test.duration;
    }

    isComingSoon() {
        return this.lesson.data.coming_soon;
    }
}
