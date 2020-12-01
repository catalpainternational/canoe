import test from "ava";

import resourceArticleJSON from "./pageData/resource";

import ResourceArticle from "../js/ResourceArticle";

// Because AVA runs tests concurrently it does not group their output like Mocha or Jest

// Test ResourceArticle's properties.
test("ResourceArticle properties: ResourceArticle's id matches resource JSON's id.", (t) => {
    const ra = new ResourceArticle(resourceArticleJSON);
    t.is(ra.id, resourceArticleJSON.id);
});
test("ResourceArticle properties: ResourceArticle's title matches resource JSON's title.", (t) => {
    const ra = new ResourceArticle(resourceArticleJSON);
    t.is(ra.title, resourceArticleJSON.title);
});
test("ResourceArticle properties: ResourceArticle's description matches resource JSON's description.", (t) => {
    const ra = new ResourceArticle(resourceArticleJSON);
    t.is(ra.description, resourceArticleJSON.description);
});
test("ResourceArticle properties: ResourceArticle's cards match resource JSON's cards.", (t) => {
    const ra = new ResourceArticle(resourceArticleJSON);
    t.deepEqual(ra.cards, resourceArticleJSON.cards);
});
test("ResourceArticle properties: ResourceArticle's tags match resource JSON's tags.", (t) => {
    const ra = new ResourceArticle(resourceArticleJSON);
    t.deepEqual(ra.tags, resourceArticleJSON.tags);
});

// describe("Tests ResourceArticle's methods.", () => {
//     test.each`
//         articleJSON                       | expected
//         ${resourceArticleJSON}            | ${false}
//         ${{ is_visible_to_guests: true }} | ${true}
//     `("ResourceArticle.isVisibleToGuests() is $expected", ({ articleJSON, expected }) => {
//         const ra = new ResourceArticle(articleJSON);
//         expect(ra.isVisibleToGuests()).toBe(expected);
//     });
// });
