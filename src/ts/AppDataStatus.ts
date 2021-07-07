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

import Logger from "./Logger";

type AfcFunction = (item: TPublishableItem) => Promise<TAppelflapResult>;

const logger = new Logger("AppDataStatus");

/** An overview of the status for all cached data used by the app */
export class AppDataStatus {
    //#region Implement as Singleton
    static instance: AppDataStatus;
    private itemListing: TItemListing[];

    private constructor() {
        logger.log("Singleton created");
        this.itemListing = [];
    }

    public static getInstance(): AppDataStatus {
        if (!AppDataStatus.instance) {
            AppDataStatus.instance = new AppDataStatus();
        }

        return AppDataStatus.instance;
    }
    //#endregion

    async ItemListings(): Promise<TItemListing[]> {
        if (this.itemListing.length) {
            return this.itemListing;
        }

        this.itemListing = await this.BuildList();
        return this.itemListing;
    }

    private async ManifestListing(): Promise<TItemListing> {
        const manifest = Manifest.getInstance();
        const isAvailableOffline = await manifest.isAvailableOffline();

        return {
            title: "manifest",
            backendPath: manifest.backendPath,
            cacheKey: manifest.cacheKey,
            version: manifest.version,
            type: "manifest",
            isValid: manifest.isValid,
            isAvailableOffline: isAvailableOffline,
            isPublishable: manifest.isPublishable,
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
            const page = new Page(Manifest.getInstance(), pageId);
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

    private async BuildList(): Promise<TItemListing[]> {
        const itemListings: TItemListing[] = [];
        itemListings.push(await this.ManifestListing());

        const pageIds = Object.keys(Manifest.getInstance().pages);
        const cacheKeys = await CacheKeys();

        const pageListings: TItemListing[] = [];
        for (let ix = 0; ix < pageIds.length; ix++) {
            const pageId = pageIds[ix];
            const manifestPage = Manifest.getInstance().pages[pageId];
            const inCache = cacheKeys.includes(manifestPage.storage_container);
            const pageListing = await this.PageListing(
                pageId,
                manifestPage,
                inCache
            );
            pageListings.push(pageListing);
        }

        // Add the page listings in order of published, publishable, available, valid, none of the above
        itemListings.push(
            ...pageListings.filter((pageListing) => pageListing.isPublishable)
        );
        itemListings.push(
            ...pageListings.filter(
                (pageListing) =>
                    !pageListing.isPublishable && pageListing.isAvailableOffline
            )
        );
        itemListings.push(
            ...pageListings.filter(
                (pageListing) =>
                    !pageListing.isPublishable &&
                    !pageListing.isAvailableOffline &&
                    pageListing.isValid
            )
        );
        itemListings.push(
            ...pageListings.filter(
                (pageListing) =>
                    !pageListing.isPublishable &&
                    !pageListing.isAvailableOffline &&
                    !pageListing.isValid
            )
        );

        return itemListings;
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

        const manifest = Manifest.getInstance();

        const performed: TPublishResult = {};
        for (let ix = 0; ix < performable.length; ix++) {
            const item = performable[ix];
            if (item.type === "manifest") {
                try {
                    const publishableManifest =
                        await this.ManifestToPublishableItem(manifest);
                    const result = await action(publishableManifest);
                    performed[manifest.cacheKey] = {
                        result: result,
                        reason: result,
                    };
                } catch (err) {
                    performed[manifest.cacheKey] = {
                        result: "failed",
                        reason: err,
                    };
                }
            } else if (item.type === "page") {
                const page = manifest.getPageManifestData(item.cacheKey);
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
        logger.info(
            "Publish all items that are already certified, or that can be certifified"
        );
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
        const itemListings = await this.ItemListings();
        const subscriptions = await setSubscriptions(itemListings);
        if (
            typeof subscriptions === "string" &&
            subscriptions === "not relevant"
        ) {
            logger.warn("Could not set subscriptions ");

            return { types: { CACHE: { groups: {} } } };
        }
        return subscriptions as TSubscriptions;
    }
}
