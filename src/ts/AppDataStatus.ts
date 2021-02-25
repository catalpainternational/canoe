import {
    TItemListing,
    TItemStorageStatus,
} from "ts/Types/PublishableItemTypes";
import { TWagtailPage } from "ts/Types/PageTypes";
import { TAppelflapResult } from "ts/Types/CanoeEnums";

import { IPublishableItem } from "ts/Interfaces/PublishableItemInterfaces";

import { Manifest } from "ts/Implementations/Manifest";
import { Page } from "ts/Implementations/Page";
import {
    getSubscriptions,
    publishItem,
    setSubscriptions,
    unpublishItem,
} from "ts/Implementations/ItemActions";
import {
    CacheKeys,
    InitialiseByRequest,
    InitialiseFromCache,
} from "ts/Implementations/CacheItem";

import { AppelflapConnect } from "ts/AppelflapConnect";

import {
    getPageData as getPageDataFromStore,
    getItemStorageStatus,
} from "ReduxImpl/Interface";
import { TSubscriptions } from "./Types/CacheTypes";

type AfcFunction = (
    item: IPublishableItem,
    appelflapConnect: AppelflapConnect
) => Promise<TAppelflapResult>;

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
                await InitialiseByRequest(this.manifest);
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
            await InitialiseFromCache(page);
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
    async PublishAll(): Promise<Record<string, TAppelflapResult>> {
        return this.PerformAll((listing) => listing.isPublishable, publishItem);
    }

    /** Unpublish everything currently not flagged as isPublishable */
    async UnpublishAll(): Promise<Record<string, TAppelflapResult>> {
        return this.PerformAll(
            (listing) => !listing.isPublishable,
            unpublishItem
        );
    }

    /** Get all current subscriptions */
    async GetSubscriptions(): Promise<TSubscriptions> {
        const appelflapConnect = new AppelflapConnect();
        const subscriptions = await getSubscriptions(appelflapConnect);
        if (typeof subscriptions === "string") {
            return { origins: {} };
        }
        return subscriptions;
    }

    /** Set all current subscriptions */
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
}
