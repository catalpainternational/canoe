import { getOrFetchManifest, getHomePathsInManifest } from "js/WagtailPagesAPI";
import { dispatchToastEvent } from "js/Events";
import { leftDifference } from "js/SetMethods";
import { getImagePaths } from "js/RenditionSelector";
import { getAuthenticationToken } from "js/AuthenticationUtilities";
import { storeWagtailPage } from "ReduxImpl/Interface";
import { BACKEND_BASE_URL } from "js/urls";

const PAGES_CACHE = "pages-cache";
const IMAGES_CACHE = "images-cache";

const trimDomain = (urlWithDomain) => urlWithDomain.replace(/^.*\/\/[^\/]+/, "");

const getCachedPathsAndDeleteCruft = async (cacheName, manifestsUrls) => {
    const cache = await caches.open(cacheName);
    const cacheKeys = await cache.keys();
    const cachedUrls = new Set();

    for (const request of cacheKeys) {
        const cachedUrl = trimDomain(request.url);
        const isCachedUrlInManifest = manifestsUrls.has(cachedUrl);

        if (isCachedUrlInManifest) {
            cachedUrls.add(cachedUrl);
        } else {
            cache.delete(request);
        }
    }
    return cachedUrls;
};

const cacheAllUrls = async (cacheName, paths) => {
    const cache = await window.caches.open(cacheName);
    const token = getAuthenticationToken();
    const pathArray = Array.from(paths);

    return await cache.addAll(
        pathArray.map(
            (path) =>
                new Request(`${BACKEND_BASE_URL}${path}`, {
                    mode: "cors",
                    headers: {
                        "Content-Type": "text/json",
                        Authorization: `JWT ${token}`,
                    },
                })
        )
    );
};

const addCachedPagesToRedux = async () => {
    const pagesCache = await caches.open(PAGES_CACHE);
    const cacheKeys = await pagesCache.keys();

    for (const cacheKeyRequest of cacheKeys) {
        const cachedPage = await pagesCache.match(cacheKeyRequest);
        if (!cachedPage) {
            return;
        }
        const wagtailPage = await cachedPage.json();
        storeWagtailPage(wagtailPage);
    }
};

export default class SiteDownloader {
    async requestTheSitesPagesAndImages() {
        const manifest = await getOrFetchManifest();

        const homePagePaths = getHomePathsInManifest(manifest);
        const manifestsPagePaths = new Set([...homePagePaths, ...Object.values(manifest.pages)]);
        const manifestsImagesPaths = new Set(getImagePaths(manifest.images));

        const cachedPagePaths = await getCachedPathsAndDeleteCruft(PAGES_CACHE, manifestsPagePaths);
        const cachedImagePaths = await getCachedPathsAndDeleteCruft(
            IMAGES_CACHE,
            manifestsImagesPaths
        );

        const pagesToFetch = leftDifference(manifestsPagePaths, cachedPagePaths);
        const imagesToFetch = leftDifference(manifestsImagesPaths, cachedImagePaths);

        if (pagesToFetch.size > 0 || imagesToFetch.size > 0) {
            dispatchToastEvent(gettext("Site is downloading."));
        }

        await cacheAllUrls(PAGES_CACHE, pagesToFetch);
        await cacheAllUrls(IMAGES_CACHE, imagesToFetch);
        await addCachedPagesToRedux();

        if (pagesToFetch.size > 0 || imagesToFetch.size > 0) {
            dispatchToastEvent(gettext("Site download is complete!"));
        }
    }
}
