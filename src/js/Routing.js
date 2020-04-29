import {
    fetchPage,
    getOrFetchWagtailPage,
    getOrFetchManifest,
    getHomePage,
} from "js/WagtailPagesAPI.js";

const IS_SETTINGS_NOTIFICATIONS_OR_PROFILE = /#([A-Za-z]+)/;
const IS_WAGTAIL_PAGE = /#([\d]+)/; // should match '#3' and '#3/objectives'
const IS_PAGE_PREVIEW = /^\?(.+)/;

const getPreviewPageUrl = (queryString) => {
    const params = {};
    queryString.replace(/([^=&]+)=([^&]*)/g, function (m, key, value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
    });
    const contentType = encodeURIComponent(params["content_type"]);
    const token = encodeURIComponent(params["token"]);
    const apiURL = `/api/v2/page_preview/1/?content_type=${contentType}&token=${token}&format=json`;
    return apiURL;
};

export const getPage = async () => {
    const manifest = await getOrFetchManifest();

    const wagtailPageMatch = window.location.hash.match(IS_WAGTAIL_PAGE);
    const wagtailPreviewMatch = window.location.search.match(IS_PAGE_PREVIEW);
    const appPageMatch = window.location.hash.match(IS_SETTINGS_NOTIFICATIONS_OR_PROFILE);

    let page = null;
    let pageUrl = null;

    if (wagtailPageMatch) {
        const pageId = wagtailPageMatch[1];
        const pageUrl = manifest.pages[pageId];
        page = await getOrFetchWagtailPage(pageUrl);
    } else if (wagtailPreviewMatch) {
        const queryString = wagtailPreviewMatch[1];
        pageUrl = getPreviewPageUrl(queryString);
        page = await fetchPage(pageUrl);
    } else if (appPageMatch) {
        const pageType = appPageMatch[1];
        page = {
            meta: {
                type: pageType,
            },
        };
    } else {
        page = await getHomePage();
    }

    return page;
};

export const getPreviewQueryFromURL = () => {
    const querystring = window.location.search.replace(/^\?/, "");
    return querystring;
};

export const parseURLHash = () => {
    const afterTheHash = window.location.hash.substr(1);
    return afterTheHash.split("/");
};

export function getLessonCardIdx() {
    return parseInt(location.hash.split("/")[2]) - 1;
}

export function getLessonModuleHash(lessonId, lessonModule, lessonCardIdx) {
    return "#" + lessonId + "/" + lessonModule + "/" + (lessonCardIdx + 2);
}
