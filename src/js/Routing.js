import {
    fetchPage,
    getOrFetchWagtailPage,
    getOrFetchManifest,
    getHomePage,
} from "js/WagtailPagesAPI";
import { getLanguage, setRoute } from "ReduxImpl/Interface";
import { PageLacksTranslationDataError } from "js/Errors";
import { logPageView } from "js/GoogleAnalytics";
import { getManifestFromStore } from "./redux/Interface";
import { Manifest } from "ts/Implementations/Manifest";

const IS_CANOE_PAGE = /#([A-Za-z]+)/;
const IS_WAGTAIL_PAGE = /#([\d]+)/; // should match '#3' and '#3/objectives'
const IS_PAGE_PREVIEW = /^\?(.+)/;

export function initialiseRouting() {
    window.addEventListener("hashchange", async () => {
        route(window.location.hash);
    });
    route(window.location.hash);
}

async function route(hash) {
    logPageView(hash);

    // If we are a simple canoe page all should be good
    const appPageMatch = hash.match(IS_CANOE_PAGE);
    if(appPageMatch) {
        setRoute(appPageMatch[1]);
        return;
    }

    // otherwise we need a manifest to understand what to render
    try {
        const manifest = await getValidManifest();
        const page = hash.length ? manifest.getPageManifestData(hash) : manifest.getLanguageHome(getLanguage());
        setRoute(page);
    } catch {
        setRoute("error");
    }
}

async function getValidManifest() {
    const manifest = new Manifest();
    if (!manifest.isValid) {
        await manifest.initialiseByRequest();
        return manifest;
    } else {
        return Promise.resolve(manifest);
    }
}

//  below here deprecated

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

const routeToTranslation = (translationPageId) => {
    const [, section, cardNumber] = parseURLHash();
    let translatedPageUrl = `#${translationPageId}`;
    if (section) {
        translatedPageUrl += `/${section}/`;
    }
    if (cardNumber) {
        translatedPageUrl += `${cardNumber}`;
    }
    window.location = translatedPageUrl;
};

export const getWagtailPageOrRouteToTranslation = async (pageId) => {
    const manifest = await getOrFetchManifest();
    const manifestPage = manifest.pages[pageId];
    const pagePath = manifestPage ? manifestPage.api_url : "";
    const page = await getOrFetchWagtailPage(pagePath);

    const currentLanguage = getLanguage();
    const translationInfo = page.data.translations;

    if (!translationInfo) {
        throw new PageLacksTranslationDataError(
            "Routable page objects must have a `.data.translations`"
        );
    }

    const translationsLangCodes = Object.keys(translationInfo);
    // The default case:
    // The page you're viewing is in the current language, which means the
    // page's translations should lack the current language. Return the page.
    if (!translationsLangCodes.includes(currentLanguage)) {
        return page;
    }

    // Otherwise, we want the page in the current language. Grab it from the
    // incorrect page's translations.
    const translationPageId = translationInfo[currentLanguage];
    routeToTranslation(translationPageId);
    return page;
};

export const getPage = async () => {
    const wagtailPageMatch = window.location.hash.match(IS_WAGTAIL_PAGE);
    const wagtailPreviewMatch = window.location.search.match(IS_PAGE_PREVIEW);
    const appPageMatch = window.location.hash.match(IS_SETTINGS_RESOURCES_OR_PROFILE);

    let page = null;
    let pageUrl = null;

    if (wagtailPageMatch) {
        const pageId = wagtailPageMatch[1];
        page = await getWagtailPageOrRouteToTranslation(pageId);
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
    const queryString = window.location.search.replace(/^\?/, "");
    return queryString;
};

export const parseURLHash = () => {
    const afterTheHash = window.location.hash.substr(1);
    return afterTheHash.split("/");
};

export const getSearchQueryFromUrl = () => {
    const currentHash = parseURLHash();
    const queryString = currentHash[0].split("?")[1];
    return queryString;
};

export function getLessonCardIdx() {
    return parseInt(location.hash.split("/")[2]) - 1;
}

export function getNextCardsUrl(lessonId, lessonModule, lessonCardIdx) {
    return "#" + lessonId + "/" + lessonModule + "/" + (lessonCardIdx + 2);
}

export function getPreviousCardsUrl(lessonId, lessonModule, lessonCardIdx) {
    return "#" + lessonId + "/" + lessonModule + "/" + lessonCardIdx;
}

export function getHashPieces() {
    return location.hash.split("/");
}
