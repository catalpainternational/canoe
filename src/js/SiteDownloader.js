import {
    fetchPage,
    fetchImage,
    getOrFetchManifest,
    getHomePathsInManifest,
} from "js/WagtailPagesAPI";
import { storeWagtailPage } from "ReduxImpl/Store";
import { dispatchToastEvent } from "js/Events";
import { leftDifference } from "js/SetMethods";
import { getImagePaths } from "js/RenditionSelector";

const trimDomain = (urlWithDomain) => urlWithDomain.replace(/^.*\/\/[^\/]+/, "");

const addCachedPageToRedux = async (cacheKeyRequest) => {
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
        this.PAGES_CACHE = "pages-cache";
        this.MEDIA_CACHE = "images-cache";
    }

    async requestTheSitesPagesAndImages() {
        const manifest = await getOrFetchManifest();

        const homePagePaths = getHomePathsInManifest(manifest);
        const manifestsPageUrls = new Set([...homePagePaths, ...Object.values(manifest.pages)]);
        const manifestsMediaUrls = new Set(getImagePaths(manifest.images));

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

        if (pagesToFetch.size > 0 || imagesToFetch.size > 0) {
            dispatchToastEvent(gettext("Site is downloading."));
        }

        for (const pagePath of pagesToFetch) {
            const wagtailPage = await fetchPage(pagePath);
            storeWagtailPage(wagtailPage);
        }

        for (const imagePath of imagesToFetch) {
            await fetchImage(imagePath);
        }

        if (pagesToFetch.size > 0 || imagesToFetch.size > 0) {
            dispatchToastEvent(gettext("Site download is complete!"));
        }
    }
}
