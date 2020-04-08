import { fetchPage, fetchImage, getOrFetchManifest } from "js/WagtailPagesAPI";
import { storeWagtailPage } from "ReduxImpl/Store";

const trimDomain = urlWithDomain => urlWithDomain.replace(/^.*\/\/[^\/]+/, "");

const leftDifference = (leftSet, rightSet) => {
    const _difference = new Set(leftSet);
    for (const element of rightSet) {
        _difference.delete(element);
    }
    return _difference;
};

const addCachedPageToRedux = async cacheKeyRequest => {
    const pagesCache = await caches.open("pages-cache");
    const cachedPage = await pagesCache.match(cacheKeyRequest);
    if (!cachedPage) {
        return;
    }
    const wagtailPage = await cachedPage.json();
    storeWagtailPage(wagtailPage);
};

const getCachedUrlsAndDeleteCruft = async (cacheName, manifestsUrls) => {
    const cache = await caches.open(cacheName);
    const cacheKeys = await cache.keys();
    const cachedUrls = new Set();

    for (const request of cacheKeys) {
        const cachedUrl = trimDomain(request.url);
        const isCachedUrlInManifest = manifestsUrls.has(cachedUrl);

        if (isCachedUrlInManifest) {
            cachedUrls.add(cachedUrl);
            addCachedPageToRedux(request);
        } else {
            cache.delete(request);
        }
    }
    return cachedUrls;
};

export class SiteDownloader {
    constructor() {
        if (!navigator.serviceWorker) {
            return;
        }
        this.PAGES_CACHE = "pages-cache";
        this.MEDIA_CACHE = "images-cache";
    }

    async requestTheSitesPagesAndImages() {
        const manifest = await getOrFetchManifest();

        const manifestsPageUrls = new Set([manifest.home, ...Object.values(manifest.pages)]);
        const manifestsMediaUrls = new Set(Object.values(manifest.images));

        const cachedPageUrls = await getCachedUrlsAndDeleteCruft(
            this.PAGES_CACHE,
            manifestsPageUrls
        );
        const cachedMediaUrls = await getCachedUrlsAndDeleteCruft(
            this.MEDIA_CACHE,
            manifestsMediaUrls
        );

        const pagesToFetch = leftDifference(manifestsPageUrls, cachedPageUrls);
        const imagesToFetch = leftDifference(manifestsMediaUrls, cachedMediaUrls);

        for (const pagePath of pagesToFetch) {
            const wagtailPage = await fetchPage(pagePath);
            storeWagtailPage(wagtailPage);
        }

        for (const imagePath of imagesToFetch) {
            await fetchImage(imagePath);
        }
    }
}
