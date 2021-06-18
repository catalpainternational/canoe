import { getLanguage, setRoute, isAuthenticated, setAndGetPreviewing } from "ReduxImpl/Interface";
import { logPageView } from "js/GoogleAnalytics";

import { Manifest } from "ts/Implementations/Manifest";

// If true REQUIRE_LOGIN will always redirect any user who does not have a login to the login page
// unless they have a manifest cache in place already
const REQUIRE_LOGIN = process.env.REQUIRE_LOGIN;

const LOGIN_ROUTE = 'login';
// pages that are rendered by the application
const CANOE_PAGES = ['settings', 'profile', 'sync'];
/** Pages that are shortcuts into a CMS page,
 * e.g. resources goes to the selected language resource root
 * 
 * These are defined as arrays, the first page found in the manifest will be the one returned */
const CANOE_SHORTCUTS = {
    "": ["homepage", "learningactivitieshomepage"],
    home: ["homepage"],
    resources: ["resourcesroot"],
    topics: ["learningactivitieshomepage"],
};

export function initialiseRouting() {
    window.addEventListener("hashchange", async () => {
        route(window.location);
    });
    route(window.location);
}

async function route(location) {
    const hash = location.hash.slice(1);
    const queryParams = new URLSearchParams(location.search);
    const hashParts = hash.split(":");
    const pageHash = hashParts[0];
    const riotHash = hashParts.slice(1);
    let page = undefined;
    let manifest = undefined;
    let route = undefined;

    const previewing = setAndGetPreviewing(queryParams.get("preview"));

    logPageView(hash);

    if(pageHash === LOGIN_ROUTE) {
        // If we are a simple canoe page all should be good
        route = {page: {type: LOGIN_ROUTE}, riotHash};
    } else {
        // otherwise we need a manifest ( bottom nav always needs to know )
        try {
            // manifest needs to know if we are getting a preview
            manifest = await getValidManifest(previewing);
        } catch (err) {
            setRoute({
                page: {
                    type: "error",
                    errorType: "no_manifest",
                    error: err,
                }
            });
            return;
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
                CANOE_SHORTCUTS[pageHash].forEach((shortcutRoute) => {
                    if (page) {
                        return;
                    }
                    page = manifest.getLanguagePageType(getLanguage(), shortcutRoute);
                });
            } else {
                // If we are a shortcut get the first page of that type from the manifest
                try {
                    page = manifest.getPageManifestData(pageHash);
                } catch(err) {
                    setRoute({
                        page: {
                            type: "error",
                            errorType: "not_found",
                        }
                    });
                }
            }
            route = !!page 
                ? {page, riotHash}
                : {page: {type: "pageHash_error", error: `The page shortcut "~{pageHash}" had no match in the Manifest`}};

            // refresh the page
            if (!page.ready || previewing) {
                page.prepare();
            }
        }
    }

    setRoute(route);
}

async function getValidManifest(previewing) {
    const manifest = Manifest.getInstance();
    if (!manifest.isValid || previewing) {
        // we need to wait
        await manifest.prepare();
    } else {
        // let's not wait, but still refresh
        manifest.prepare();
    }
    return Promise.resolve(manifest);
}
