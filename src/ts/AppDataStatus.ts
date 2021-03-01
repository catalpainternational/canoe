import {
    TItemListing,
    TItemStorageStatus,
} from "ts/Types/PublishableItemTypes";
import { TWagtailPage } from "ts/Types/PageTypes";

import { Manifest } from "ts/Implementations/Manifest";
import { Page } from "ts/Implementations/Page";

import { AppelflapConnect } from "ts/AppelflapConnect";
import { CacheUtilities } from "ts/CacheUtilities";

import {
    getPageData as getPageDataFromStore,
    getItemStorageStatus,
} from "ReduxImpl/Interface";

/** An overview of the status for all data used by the app */
export class AppDataStatus {
    manifest: Manifest;
    itemListings: TItemListing[];

    constructor() {
        this.manifest = new Manifest();
        this.itemListings = [];
    }

    async Initialise(): Promise<string> {
        if (!this.manifest.isValid) {
            try {
                await this.manifest.initialiseByRequest();
            } catch {
                return Promise.reject(
                    "Manifest is not valid, and could not be initialised from the network"
                );
            }
        }

        if (!this.manifest.isValid) {
            return Promise.reject(
                "Manifest is not valid, and initialisation from the network failed"
            );
        }

        return Promise.resolve("Manifest valid");
    }

    ManifestListing(): TItemListing {
        return {
            id: this.manifest.id,
            title: "manifest",
            api_url: this.manifest.api_url,
            cacheKey: this.manifest.cacheKey,
            version: this.manifest.version,
            type: "manifest",
            storeStatus: this.manifest.status.storeStatus,
            cacheStatus: this.manifest.status.cacheStatus,
            isValid: this.manifest.isValid,
            isAvailableOffline: this.manifest.isAvailableOffline,
            isPublishable: this.manifest.isPublishable,
        };
    }

    async PageListing(
        pageId: string,
        manifestPage: TWagtailPage,
        inCache: boolean
    ): Promise<TItemListing> {
        const statusId = manifestPage.storage_container;
        const pageStatus = getItemStorageStatus(statusId);
        const status =
            pageStatus !== null
                ? (pageStatus as TItemStorageStatus)
                : ({
                      storeStatus: "unset",
                      cacheStatus: "unset",
                  } as TItemStorageStatus);
        let isValid = false;
        let isAvailableOffline = false;
        let isPublishable = false;

        const pageData = getPageDataFromStore(pageId);
        status.storeStatus = pageData ? "ready" : "unset";

        if (inCache) {
            const page = new Page(this.manifest, pageId, statusId);
            await page.initialiseFromCache();
            status.cacheStatus = page.status.cacheStatus;
            isValid = page.isValid;
            isAvailableOffline = page.isAvailableOffline;
            isPublishable = page.isPublishable;
        }

        // TODO: add code to get item status (isValid, etc.)
        return {
            id: pageId,
            title: manifestPage.title,
            api_url: statusId,
            cacheKey: manifestPage.storage_container,
            version: manifestPage.version,
            type: "page",
            storeStatus: status.storeStatus,
            cacheStatus: status.cacheStatus,
            isValid: isValid,
            isAvailableOffline: isAvailableOffline,
            isPublishable: isPublishable,
        };
    }

    async BuildList(): Promise<void> {
        this.itemListings = [];
        this.itemListings.push(this.ManifestListing());

        const pageIds = Object.keys(this.manifest.pages);
        const cacheKeys = await CacheUtilities.cacheKeys();

        for (let ix = 0; ix < pageIds.length; ix++) {
            const pageId = pageIds[ix];
            const manifestPage = this.manifest.pages[pageId];
            const inCache = cacheKeys.includes(manifestPage.storage_container);
            const pageListing = await this.PageListing(
                pageId,
                manifestPage,
                inCache
            );
            this.itemListings.push(pageListing);
        }
    }

    /** Publish everything currently flagged as isPublishable */
    async PublishAll(): Promise<Record<string, boolean>> {
        const appelflapConnect = new AppelflapConnect();
        const publishable = this.itemListings.filter(
            (listing) => listing.isPublishable
        );

        const published: Record<string, boolean> = {};
        for (let ix = 0; ix < publishable.length; ix++) {
            const item = publishable[ix];
            if (item.type === "manifest") {
                try {
                    published["manifest"] = await this.manifest.publish(
                        appelflapConnect
                    );
                } catch {
                    published["manifest"] = false;
                }
            } else if (item.type === "page") {
                const page = this.manifest.getPageManifestData(item.cacheKey);
                try {
                    published[item.cacheKey] =
                        (await page?.publish(appelflapConnect)) || false;
                } catch {
                    published[item.cacheKey] = false;
                }
            }
        }

        return published;
    }
}
