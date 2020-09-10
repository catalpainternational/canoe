import resourceArticleJSON from "./pageData/resource";

import ResourceArticle from "js/ResourceArticle";

describe("Tests ResourceArticle's properties.", () => {
    test("ResourceArticle's id matches resource JSON's id.", () => {
        const ra = new ResourceArticle(resourceArticleJSON);
        expect(ra.id).toBe(resourceArticleJSON.id);
    });

    test("ResourceArticle's title matches resource JSON's title.", () => {
        const ra = new ResourceArticle(resourceArticleJSON);
        expect(ra.title).toBe(resourceArticleJSON.title);
    });

    test("ResourceArticle's description matches resource JSON's description.", () => {
        const ra = new ResourceArticle(resourceArticleJSON);
        expect(ra.description).toBe(resourceArticleJSON.description);
    });

    test("ResourceArticle's cards match resource JSON's cards.", () => {
        const ra = new ResourceArticle(resourceArticleJSON);
        expect(ra.cards).toEqual(resourceArticleJSON.cards);
    });

    test("ResourceArticle's tags match resource JSON's tags.", () => {
        const ra = new ResourceArticle(resourceArticleJSON);
        expect(ra.tags).toEqual(resourceArticleJSON.tags);
    });
});

describe("Tests ResourceArticle's methods.", () => {
    test.each`
        articleJSON                       | expected
        ${resourceArticleJSON}            | ${false}
        ${{ is_visible_to_guests: true }} | ${true}
    `("ResourceArticle.isVisibleToGuests() is $expected", ({ articleJSON, expected }) => {
        const ra = new ResourceArticle(articleJSON);
        expect(ra.isVisibleToGuests()).toBe(expected);
    });
});
