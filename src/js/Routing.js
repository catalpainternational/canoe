import { getLanguage, setRoute, isAuthenticated } from "ReduxImpl/Interface";
import { logPageView } from "js/GoogleAnalytics";

import { InitialiseByRequest } from "ts/Implementations/CacheItem";
import { Manifest } from "ts/Implementations/Manifest";

// If true REQUIRE_LOGIN will always redirect any user who does not have a login to the login page
// unless they have a manifest cache in place already
const REQUIRE_LOGIN = process.env.REQUIRE_LOGIN;

const LOGIN_ROUTE = 'login';
// pages that are rendered by the application
const CANOE_PAGES = ['settings', 'profile', 'sync'];
// pages that are shortcuts into a CMS page ( e.g. resources goes to the selected language resource root )
const CANOE_SHORTCUTS = {
    "": "homepage",
    home: "homepage",
    resources: "resourcesroot",
    topics: "learningactivitieshomepage",
};

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
    let route = undefined;

    logPageView(hash);

    if(pageHash === LOGIN_ROUTE) {
        // If we are a simple canoe page all should be good
        route = {page: {type: LOGIN_ROUTE}, riotHash};
    } else {
        // otherwise we need a manifest ( bottom nav always needs to know )
        try {
            manifest = await getValidManifest();
        } catch (err) {
            route = {page: {type: "manifest_error", error: `Manifest retrieval failure. Error: ${err}`}};
        }
        
        if( !isAuthenticated() && REQUIRE_LOGIN )
        { 
            // if the site is configured to require login and we are not logged in, show the login page 
            window.location.hash = `#${LOGIN_ROUTE}`;
            return;
        }

        if(CANOE_PAGES.includes(pageHash)) {
            // If we are a canoe page that needs page data, get it
            page = manifest.getLanguagePageType(getLanguage(), 'homepage');
            route = {page: {type: pageHash, home:page, manifest: manifest}, riotHash};
        } else {
            if(Object.keys(CANOE_SHORTCUTS).includes(pageHash)) {
                // If we are a shortcut get the first page of that type from the manifest
                page = manifest.getLanguagePageType(getLanguage(), CANOE_SHORTCUTS[pageHash]);
            } else {
                // If we are a shortcut get the first page of that type from the manifest
                page = manifest.getPageManifestData(pageHash);
            }
            route = {page, riotHash};
            // refresh the page
            if (!page.ready) {
                InitialiseByRequest(page);
            }
        }
    }

    setRoute(route);
}

async function getValidManifest() {
    const manifest = new Manifest();
    if (!manifest.isValid) {
        await InitialiseByRequest(manifest);
    } else {
        // Don't await this delierately,
        // in effect we'll try refreshing the manifest in the background
        InitialiseByRequest(manifest);
    }

    return manifest;
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
