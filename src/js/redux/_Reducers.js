import { combineReducers } from "redux";

export const UPDATED_MANIFEST = "UPDATED_MANIFEST";
export const SITE_DOWNLOADED = "SITE_DOWNLOADED";
export const ADDED_WAGTAIL_PAGE = "ADDED_WAGTAIL_PAGE";
export const LANGUAGE_CHANGE = "LANGUAGE_CHANGED";
export const UPDATED_BROWSER_SUPPORT = "UPDATED_BROWSER_SUPPORT";
export const SERVICE_WORKER_EVENT = "SERVICE_WORKER_EVENT";

const updateManifest = (state = {}, action) => {
    switch (action.type) {
        case UPDATED_MANIFEST:
            return action.manifest;
        default:
            return state;
    }
};

const signalSiteIsDownloaded = (state = false, action) => {
    switch (action.type) {
        case SITE_DOWNLOADED:
            return action.siteIsDownloaded;
        default:
            return state;
    }
};

const addWagtailPage = (state = {}, action) => {
    switch (action.type) {
        case ADDED_WAGTAIL_PAGE:
            const newPageObject = { [action.wagtailPage.id]: action.wagtailPage };
            const nextState = Object.assign({}, state, newPageObject);
            return nextState;
        default:
            return state;
    }
};

const changeLanguage = (state = '', action) => {
    switch (action.type) {
        case LANGUAGE_CHANGE:
            return action.language;
        default:
            return state;
    }
};

const signalBrowserSupport = (state = false, action) => {
    switch (action.type) {
        case UPDATED_BROWSER_SUPPORT:
            return action.isBrowserSupported;
        default:
            return state;
    }
};

const serviceWorker = (state = 'none', action) => {
    switch (action.type) {
        case SERVICE_WORKER_EVENT:
            switch (action.event_type) {
                case 'install-failed':
                    return 'install-failed';
                case 'installed':
                    return 'installed';
                case 'externalactivated':
                    return 'updated';
                case 'notsupported':
                    return 'notsupported';
                default:
                    return 'unknown';
            }
        default:
            return state;
    }
}


export const reducers = combineReducers({
    manifest: updateManifest,
    siteIsDownloaded: signalSiteIsDownloaded,
    pages: addWagtailPage,
    language: changeLanguage,
    isBrowserSupported: signalBrowserSupport,
    serviceWorker: serviceWorker,
});
