import { getLanguage, setRoute } from "ReduxImpl/Interface";
import { logPageView } from "js/GoogleAnalytics";

import { InitialiseByRequest } from "ts/Implementations/CacheItem";
import { Manifest } from "ts/Implementations/Manifest";

// pages that are rendered by the application, and do not require a manifest
const CANOE_PAGES = ['login', 'profile', 'settings', 'sync'];
// pages that are shortcuts into a CMS page ( e.g. resources goes to the selected language resource root )
const CANOE_SHORTCUTS = {
    '': 'homepage',
    'home': 'homepage',
    'learningactivities': 'learningactivitieshomepage',
    'resources': 'resourcesroot',
};

// pages from the CMS ( we might not use this )
const IS_WAGTAIL_PAGE = /([\d]+)/; // should match '#3' and '#3/objectives'

const IS_PAGE_PREVIEW = /^\?(.+)/;

export function initialiseRouting() {
    window.addEventListener("hashchange", async () => {
        route(window.location.hash);
    });
    route(window.location.hash);
}

async function route(hashWith) {
    const hash = hashWith.slice(1);
    const hashParts = hash.split(":");
    const pageHash = hashParts[0];
    const riotHash = hashParts.slice(1);
    let page = undefined;
    let manifest = undefined;

    logPageView(hash);

    // If we are a simple canoe page all should be good
    if(CANOE_PAGES.includes(pageHash)) {
        setRoute({type: pageHash}, riotHash);
        return;
    }

    // otherwise we need a manifest to understand what to render
    try {
        manifest = await getValidManifest();
    } catch (err) {
        // Note that this may leak information that we don't want leaked
        setRoute({type: "error", error: `No manifest found. Error: ${err}`});
        return;
    }

    // If we are a shortcut get the page from the manifest
    if(Object.keys(CANOE_SHORTCUTS).includes(pageHash)) {
        page = manifest.getLanguagePageType(getLanguage(), CANOE_SHORTCUTS[pageHash]);
    } else {
        page = manifest.getPageManifestData(pageHash);
    }
    if (!page.ready) {
        InitialiseByRequest(page);
    }
    setRoute(page, riotHash);
}

async function getValidManifest() {
    const manifest = new Manifest();
    if (!manifest.isValid) {
        await InitialiseByRequest(manifest);
        return manifest;
    } else {
        return Promise.resolve(manifest);
    }
}

//  below here deprecated - but still can be found in certain riot tags

export const parseURLHash = () => {
    const afterTheHash = window.location.hash.substr(1);
    return afterTheHash.split("/");
};

export const getSearchQueryFromUrl = () => {
    const currentHash = parseURLHash();
    const queryString = currentHash[0].split("?")[1];
    return queryString;
};

export function getNextCardsUrl(lessonId, lessonModule, lessonCardIdx) {
    return "#" + lessonId + "/" + lessonModule + "/" + (lessonCardIdx + 2);
}

export function getHashPieces() {
    return location.hash.split("/");
}
