import { combineReducers } from "redux";

export const UPDATED_MANIFEST = "UPDATED_MANIFEST";
export const SITE_DOWNLOADED = "SITE_DOWNLOADED";
export const ADDED_WAGTAIL_PAGE = "ADDED_WAGTAIL_PAGE";
export const LANGUAGE_CHANGE = "LANGUAGE_CHANGED";
export const UPDATED_BROWSER_SUPPORT = "UPDATED_BROWSER_SUPPORT";
export const SERVICE_WORKER = "SERVICE_WORKER";
export const NETWORK_STATE = "NETWORK_STATE";
export const CONTENT_DOWNLOAD = "CONTENT_DOWNLOAD";
export const ERROR = "ERROR";
export const ERROR_SHOWN = "ERROR_SHOWN";

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
        case SERVICE_WORKER:
            switch (action.event_type) {
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

const networkState = (state = 'unknown', action) => {
    switch (action.type) {
        case NETWORK_STATE:
            return action.networkState;
        default:
            return state;
    }
}

const contentDownloader = (state = '', action) => {
    switch (action.type) {
        case CONTENT_DOWNLOAD:
            return action.status;
        default:
            return state;
    }
}

const error = (state = '', action) => {
    switch (action.type) {
        case ERROR:
            return { message: action.message };
        case ERROR_SHOWN:
            return {
                message: state.message,
                shown: true,
            };
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
    networkState: networkState,
    contentDownloader: contentDownloader,
    error: error,
});
