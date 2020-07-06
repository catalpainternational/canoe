import { intersection } from "js/SetMethods";

export const getTagsFromPages = (pagesWithTags) => {
    const eachArticlesTags = pagesWithTags.map((page) => page.tags);
    const setOfTags = new Set(eachArticlesTags.flat());
    return Array.from(setOfTags).map(tag => tag.toLowerCase());
};

export const doPageTagsMatchSelections = (pageTags, selectedTags) => {
    if (selectedTags.length === 0) {
        return true;
    }
    const pageTagSet = new Set(pageTags);
    const selectedTagSet = new Set(selectedTags);

    const overlap = intersection(pageTagSet, selectedTagSet);
    return overlap.size > 0;
};

export const doesQueryMatchSearchContent = (query, ...searchableStrings) => {
    if (!query) {
        return true;
    }
    const lowercaseQuery = query.toLowerCase();
    const searchIndex = searchableStrings.reduce((a, b) => a + b.toLowerCase(), "");
    return searchIndex.includes(lowercaseQuery);
};
