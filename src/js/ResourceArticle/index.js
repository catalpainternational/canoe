class ResourceArticle {
    constructor(aWagtailPage) {
        this.article = aWagtailPage;
    }

    get id() {
        return this.article.id;
    }

    get title() {
        return this.article.title;
    }

    get description() {
        return this.article.description;
    }

    get cards() {
        return this.article.cards;
    }

    get tags() {
        return this.article.tags;
    }
}

export default ResourceArticle;
