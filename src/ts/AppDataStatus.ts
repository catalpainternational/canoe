// import { TSubscriptions } from "./Types/CacheTypes";
// import { TAppelflapResult } from "./Types/CanoeEnums";
import { TWagtailPage } from "./Types/PageTypes";
import { TItemListing } from "./Types/PublishableItemTypes";

// import { TPublishableItem } from "./Types/PublishableItemTypes";

import {
    CacheKeys,
    // InitialiseFromCache
} from "./Implementations/CacheItem";
// import {
//     getSubscriptions,
//     publishItem,
//     setSubscriptions,
//     unpublishItem,
// } from "./Implementations/ItemActions";
import { Manifest } from "./Implementations/Manifest";
import { Page } from "./Implementations/Page";

// import { AppelflapConnect } from "./AppelflapConnect";

import { getPageData as getPageDataFromStore } from "ReduxImpl/Interface";

/*
type AfcFunction = (
    item: TPublishableItem,
    appelflapConnect: AppelflapConnect
) => Promise<TAppelflapResult>;
*/

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
            return Promise.reject(
                "Manifest is not valid, and initialisation from the network failed"
            );
        }

        return Promise.resolve("Manifest valid");
    }

    async ManifestListing(): Promise<TItemListing> {
        const isAvailableOffline = await this.manifest.isAvailableOffline();

        return {
            title: "manifest",
            url: this.manifest.url,
            cacheKey: this.manifest.cacheKey,
            version: this.manifest.version,
            type: "manifest",
            isValid: this.manifest.isValid,
            isAvailableOffline: isAvailableOffline,
            isPublishable: this.manifest.isPublishable,
        };
    }

    async PageListing(
        pageId: string,
        manifestPage: TWagtailPage,
        inCache: boolean
    ): Promise<TItemListing> {
        const statusId = manifestPage.storage_container;
        let isValid = false;
        let isAvailableOffline = false;
        let isPublishable = false;

        const pageData = getPageDataFromStore(pageId);

        if (inCache) {
            const page = new Page(this.manifest, pageId);
            // await InitialiseFromCache(page);
            isValid = page.isValid;
            isAvailableOffline = await page.isAvailableOffline();
            isPublishable = await page.isPublishable();
        }

        // TODO: add code to get item status (isValid, etc.)
        return {
            title: manifestPage.title,
            url: statusId,
            cacheKey: manifestPage.storage_container,
            version: manifestPage.version,
            type: "page",
            isValid: isValid,
            isAvailableOffline: isAvailableOffline,
            isPublishable: isPublishable,
        };
    }

    async BuildList(): Promise<void> {
        this.itemListings = [];
        this.itemListings.push(await this.ManifestListing());

        const pageIds = Object.keys(this.manifest.pages);
        const cacheKeys = await CacheKeys();

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
    /*

    private async PerformAll(
        filter: (item: TItemListing) => boolean,
        action: AfcFunction
    ) {
        const appelflapConnect = new AppelflapConnect();
        const performable = this.itemListings.filter(filter);

        const performed: Record<string, TAppelflapResult> = {};
        for (let ix = 0; ix < performable.length; ix++) {
            const item = performable[ix];
            if (item.type === "manifest") {
                try {
                    performed[this.manifest.cacheKey] = await action(
                        this.manifest,
                        appelflapConnect
                    );
                } catch {
                    performed[this.manifest.cacheKey] = "failed";
                }
            } else if (item.type === "page") {
                const page = this.manifest.getPageManifestData(item.cacheKey);
                if (!page) {
                    performed[item.cacheKey] = "not relevant";
                } else {
                    try {
                        performed[item.cacheKey] =
                            (await action(page, appelflapConnect)) ||
                            "not relevant";
                    } catch {
                        performed[item.cacheKey] = "failed";
                    }
                }
            }
        }

        return performed;
    }

    /** Publish everything currently flagged as isPublishable */
    /*
    async PublishAll(): Promise<Record<string, TAppelflapResult>> {
        return this.PerformAll((listing) => listing.isPublishable, publishItem);
    }
    */
    /*

    /** Unpublish everything currently not flagged as isPublishable */
    /*
    async UnpublishAll(): Promise<Record<string, TAppelflapResult>> {
        return this.PerformAll(
            (listing) => !listing.isPublishable,
            unpublishItem
        );
    }
    */

    /** Get all current subscriptions */
    /*
    async GetSubscriptions(): Promise<TSubscriptions> {
        const appelflapConnect = new AppelflapConnect();
        const subscriptions = await getSubscriptions(appelflapConnect);
        if (typeof subscriptions === "string") {
            return { origins: {} };
        }
        return subscriptions;
    }

    /** Set all current subscriptions */
    /*
    async SetSubscriptions(): Promise<TSubscriptions> {
        const appelflapConnect = new AppelflapConnect();
        const subscriptions = await setSubscriptions(
            this.itemListings,
            appelflapConnect
        );
        if (typeof subscriptions === "string") {
            return { origins: {} };
        }
        return subscriptions;
    }

    async SyncAll(): Promise<
        Record<
            string,
            {
                published: TAppelflapResult;
                unpublished: TAppelflapResult;
            }
        >
    > {
        const syncAllStatus: Record<
            string,
            {
                published: TAppelflapResult;
                unpublished: TAppelflapResult;
            }
        > = {};

        this.itemListings.forEach((listing) => {
            syncAllStatus[listing.cacheKey] = {
                published: "failed",
                unpublished: "failed",
            };
        });

        const published = await this.PublishAll();
        const unpublished = await this.UnpublishAll();
        let subscriptions = await this.GetSubscriptions();
        let origins = Object.keys(subscriptions.origins);
        let subscribed =
            origins.length === 1
                ? Object.entries(subscriptions.origins[origins[0]].caches)
                : [];
        let publishSubscribeMismatch = false;
        if (this.itemListings.length !== subscribed.length) {
            publishSubscribeMismatch = true;
        } else {
            publishSubscribeMismatch = subscribed.some((sub) => {
                const cacheName = sub[0];
                const version = sub[1].injected_version;
                return (
                    (!published[cacheName] && version !== null) ||
                    (published[cacheName] && version === null)
                );
            });
        }

        if (publishSubscribeMismatch) {
            subscriptions = await this.SetSubscriptions();
            origins = Object.keys(subscriptions.origins);
            subscribed = Object.entries(
                subscriptions.origins[origins[0]].caches
            );
        }

        Object.entries(published).forEach((pub) => {
            syncAllStatus[pub[0]].published = pub[1];
        });
        Object.entries(unpublished).forEach((pub) => {
            syncAllStatus[pub[0]].unpublished = pub[1];
        });

        return syncAllStatus;
    }
    */
}
