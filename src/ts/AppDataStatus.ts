import { TSubscriptions } from "./Types/CacheTypes";
import { TAppelflapResult } from "./Types/CanoeEnums";
import { TWagtailPage } from "./Types/PageTypes";
import { TItemListing, TPublishableItem } from "./Types/PublishableItemTypes";
import { TPublishResult, TSyncData } from "./Types/SyncTypes";

import {
    CacheKeys,
    // InitialiseFromCache
} from "./Implementations/CacheItem";
import {
    getSubscriptions,
    publishItem,
    setSubscriptions,
} from "./Implementations/ItemActions";
import { Manifest } from "./Implementations/Manifest";
import { Page } from "./Implementations/Page";
import { NOT_RELEVANT } from "./Constants";

type AfcFunction = (item: TPublishableItem) => Promise<TAppelflapResult>;

/** An overview of the status for all cached data used by the app */
export class AppDataStatus {
    manifest: Manifest;
    #itemListings: TItemListing[];

    constructor() {
        this.manifest = Manifest.getInstance();
        this.#itemListings = [];
    }

    async ItemListings(): Promise<TItemListing[]> {
        if (this.#itemListings.length) {
            return this.#itemListings;
        }

        await this.BuildList();
        return this.#itemListings;
    }

    private async ManifestListing(): Promise<TItemListing> {
        const isAvailableOffline = await this.manifest.isAvailableOffline();

        return {
            title: "manifest",
            backendPath: this.manifest.backendPath,
            cacheKey: this.manifest.cacheKey,
            version: this.manifest.version,
            type: "manifest",
            isValid: this.manifest.isValid,
            isAvailableOffline: isAvailableOffline,
            isPublishable: this.manifest.isPublishable,
        };
    }

    private async PageListing(
        pageId: string,
        manifestPage: TWagtailPage,
        inCache: boolean
    ): Promise<TItemListing> {
        const statusId = manifestPage.storage_container;
        let isValid = false;
        let isAvailableOffline = false;
        let isPublishable = false;

        if (inCache) {
            const page = new Page(this.manifest, pageId);
            // await InitialiseFromCache(page);
            isValid = page.isValid;
            isAvailableOffline = await page.isAvailableOffline();
            isPublishable = await page.isPublishable();
        }

        return {
            title: manifestPage.title,
            backendPath: statusId,
            cacheKey: manifestPage.storage_container,
            version: manifestPage.version,
            type: "page",
            isValid: isValid,
            isAvailableOffline: isAvailableOffline,
            isPublishable: isPublishable,
        };
    }

    private async BuildList(): Promise<void> {
        this.#itemListings = [];
        this.#itemListings.push(await this.ManifestListing());

        const pageIds = Object.keys(this.manifest.pages);
        const cacheKeys = await CacheKeys();

        const pageListings: TItemListing[] = [];
        for (let ix = 0; ix < pageIds.length; ix++) {
            const pageId = pageIds[ix];
            const manifestPage = this.manifest.pages[pageId];
            const inCache = cacheKeys.includes(manifestPage.storage_container);
            const pageListing = await this.PageListing(
                pageId,
                manifestPage,
                inCache
            );
            pageListings.push(pageListing);
        }

        // Add the page listings in order of published, publishable, available, valid, none of the above
        this.#itemListings.push(
            ...pageListings.filter((pageListing) => pageListing.isPublishable)
        );
        this.#itemListings.push(
            ...pageListings.filter(
                (pageListing) =>
                    !pageListing.isPublishable && pageListing.isAvailableOffline
            )
        );
        this.#itemListings.push(
            ...pageListings.filter(
                (pageListing) =>
                    !pageListing.isPublishable &&
                    !pageListing.isAvailableOffline &&
                    pageListing.isValid
            )
        );
        this.#itemListings.push(
            ...pageListings.filter(
                (pageListing) =>
                    !pageListing.isPublishable &&
                    !pageListing.isAvailableOffline &&
                    !pageListing.isValid
            )
        );
    }

    private async ManifestToPublishableItem(
        manifest: Manifest
    ): Promise<TPublishableItem> {
        return {
            cacheKey: manifest.cacheKey,
            version: manifest.version,
            isValid: manifest.isValid,
            isAvailableOffline: await manifest.isAvailableOffline(),
            isPublishable: manifest.isPublishable,
        } as TPublishableItem;
    }

    private async PageToPublishableItem(page: Page): Promise<TPublishableItem> {
        return {
            cacheKey: page.cacheKey,
            version: page.version,
            isValid: page.isValid,
            isAvailableOffline: await page.isAvailableOffline(),
            isPublishable: await page.isPublishable(),
        } as TPublishableItem;
    }

    private async PerformAll(
        filter: (item: TItemListing) => boolean,
        action: AfcFunction
    ) {
        const performable = (await this.ItemListings()).filter(filter);

        const performed: TPublishResult = {};
        for (let ix = 0; ix < performable.length; ix++) {
            const item = performable[ix];
            if (item.type === "manifest") {
                try {
                    const publishableManifest =
                        await this.ManifestToPublishableItem(this.manifest);
                    const result = await action(publishableManifest);
                    performed[this.manifest.cacheKey] = {
                        result: result,
                        reason: result,
                    };
                } catch (err) {
                    performed[this.manifest.cacheKey] = {
                        result: "failed",
                        reason: err,
                    };
                }
            } else if (item.type === "page") {
                const page = this.manifest.getPageManifestData(item.cacheKey);
                if (!page) {
                    performed[item.cacheKey] = {
                        result: NOT_RELEVANT,
                        reason: NOT_RELEVANT,
                    };
                } else {
                    try {
                        const publishablePage =
                            await this.PageToPublishableItem(page);
                        const result =
                            (await action(publishablePage)) || NOT_RELEVANT;
                        performed[item.cacheKey] = {
                            result: result,
                            reason: result,
                        };
                    } catch (err) {
                        performed[item.cacheKey] = {
                            result: "failed",
                            reason: err,
                        };
                    }
                }
            }
        }

        return performed;
    }

    /** Publish everything currently flagged as isPublishable
     * @remarks Note that there is no `UnpublishAll`.
     * Unpublishing (deleting) something published is handled by Appelflap itself.
     */
    async PublishAll(): Promise<TPublishResult> {
        return this.PerformAll((listing) => listing.isPublishable, publishItem);
    }

    /** Get all current subscriptions */
    async GetSubscriptions(): Promise<TSubscriptions> {
        const subscriptions = await getSubscriptions();
        if (typeof subscriptions === "string") {
            return { types: { CACHE: { groups: {} } } };
        }
        return subscriptions;
    }

    /** Set all current subscriptions */
    async SetSubscriptions(): Promise<TSubscriptions> {
        const subscriptions = await setSubscriptions(await this.ItemListings());
        if (
            typeof subscriptions === "string" &&
            subscriptions === "not relevant"
        ) {
            return { types: { CACHE: { groups: {} } } };
        }
        return subscriptions as TSubscriptions;
    }

    async SyncAll(): Promise<TSyncData> {
        const syncAllStatus: TSyncData = {};
        const itemListings = await this.ItemListings();

        itemListings.forEach((listing) => {
            syncAllStatus[listing.cacheKey] = {
                published: "failed",
            };
        });

        const published = await this.PublishAll();
        let subscriptions = await this.GetSubscriptions();
        let origins = Object.keys(subscriptions.types.CACHE?.groups || {});
        let subscribed =
            origins.length === 1
                ? Object.entries(
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      subscriptions.types.CACHE!.groups[origins[0]].names
                  )
                : [];
        let publishSubscribeMismatch = false;
        if (itemListings.length !== subscribed.length) {
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
            origins = Object.keys(subscriptions.types.CACHE?.groups || {});
            if (origins.length) {
                const firstOrigin = origins[0];
                subscribed = Object.entries(
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    subscriptions.types.CACHE!.groups[firstOrigin].names
                );
            }
        }

        Object.entries(published).forEach((pub) => {
            syncAllStatus[pub[0]].published = pub[1].result;
        });

        return syncAllStatus;
    }
}
