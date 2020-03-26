import { createStore } from "redux";

import { reducers, UPDATED_MANIFEST, SITE_DOWNLOADED, ADDED_WAGTAIL_PAGE } from "./_Reducers";

export const store = createStore(
    reducers,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export const storeWagtailPage = wagtailPage => {
    store.dispatch({ type: ADDED_WAGTAIL_PAGE, wagtailPage });
};

export const storeManifest = manifest => {
    store.dispatch({ type: UPDATED_MANIFEST, manifest });
};

export const storeSiteDownloadedIs = trueOrFalse => {
    store.dispatch({ type: SITE_DOWNLOADED, siteIsDownloaded: trueOrFalse });
};

export const getWagtailPageFromStore = pageId => {
    return store.getState().pages[pageId];
};

export const getManifestFromStore = () => {
    return store.getState().manifest;
};
