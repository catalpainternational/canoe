import { intersection } from "js/SetMethods";
import { parseURLHash } from "js/Routing";

const SEARCH_QUERY_KEY = "qs";
const TAGS_URL_KEY = "filter";

export const getTagsFromPages = (pagesWithTags) => {
    const eachArticlesTags = pagesWithTags.map((page) => page.tags);
    const setOfTags = new Set(eachArticlesTags.flat());
    return Array.from(setOfTags).map((tag) => tag.toLowerCase());
};

export const doPageTagsMatchSelections = (pageTags, selectedTags) => {
    if (selectedTags.size === 0 || selectedTags.length === 0) {
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

const getQueryStringFromUrl = () => {
    const currentHash = parseURLHash();
    const queryString = currentHash[0].split("?")[1];
    return queryString;
};

const getUrlSearchParams = () => {
    const queryStringFromURI = getQueryStringFromUrl();
    const urlParams = new URLSearchParams(queryStringFromURI);
    return urlParams;
};

export const checkUrlForSearchBarQuery = () => {
    const urlParams = getUrlSearchParams();
    const encodedQuery = urlParams.get(SEARCH_QUERY_KEY);
    if (!encodedQuery) {
        return "";
    }
    const query = decodeURIComponent(encodedQuery);
    return query;
};

export const updateUrlWithSearchBarQuery = (query) => {
    const urlParams = getUrlSearchParams();

    if (query.length > 0) {
        const encodedQuery = encodeURIComponent(query);
        urlParams.set(SEARCH_QUERY_KEY, encodedQuery);
    } else {
        urlParams.delete(SEARCH_QUERY_KEY);
    }

    // We should debounce this.
    window.location.hash = `#resources?${urlParams}`;
};

export const checkUrlForFilters = () => {
    const urlParams = getUrlSearchParams();
    const filters = urlParams.getAll("filter");
    return filters;
};

export const updateUrlWithFilters = (selectedFilters) => {
    const urlParams = getUrlSearchParams();
    urlParams.delete(TAGS_URL_KEY);
    for (const selectedFilter of selectedFilters) {
        urlParams.append(TAGS_URL_KEY, selectedFilter);
    }
    // Unlike `updateUrlWithSearchBarQuery`, this doesn't need debouncing. We
    // click tags much less than the search bar submits queries.
    window.location.hash = `#resources?${urlParams}`;
};
