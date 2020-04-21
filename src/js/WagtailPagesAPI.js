import { BACKEND_BASE_URL, WAGTAIL_MANIFEST_URL } from "js/urls.js";
import { getAuthenticationToken } from "js/AuthenticationUtilities.js";
import {
    storeWagtailPage,
    getWagtailPageFromStore,
    getManifestFromStore,
    storeManifest
} from "ReduxImpl/Store";

async function token_authed_fetch(url) {
    const token = getAuthenticationToken();

    const response = await fetch(url, {
        mode: "cors",
        headers: {
            "Content-Type": "text/json",
            Authorization: `JWT ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    const pagesResponseJSON = await response.json();

    if (pagesResponseJSON.items) {
        return pagesResponseJSON.items;
    }
    return pagesResponseJSON;
}

export async function fetchManifest() {
    const allPagesMetadata = await token_authed_fetch(WAGTAIL_MANIFEST_URL);
    return allPagesMetadata;
}

export async function fetchPage(path) {
    const pageMetadata = await token_authed_fetch(`${BACKEND_BASE_URL}${path}`);
    return pageMetadata;
}

export const fetchImage = async (url) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        // Workbox only caches crossorigin images.
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image.height);
        image.onerror = reject;
        image.src = url;
    });
};

export const getOrFetchManifest = async () => {
    const manifestInStore = getManifestFromStore();
    if (Object.entries(manifestInStore).length > 0) {
        return manifestInStore;
    }

    const manifest = await fetchManifest();
    storeManifest(manifest);
    return manifest;
};

export const getOrFetchWagtailPage = async path => {
    const pathPieces = path.split("/");
    const secondToLastPiece = pathPieces[pathPieces.length - 2];
    const pageId = Number(secondToLastPiece);

    const wagtailPageInStore = getWagtailPageFromStore(pageId);
    if (wagtailPageInStore) {
        return wagtailPageInStore;
    }

    const wagtailPage = await fetchPage(path);
    storeWagtailPage(wagtailPage);
    return wagtailPage;
};
