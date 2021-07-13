import { TTaggedSubscriptions } from "./Types/CacheTypes";
import { TAppelflapResult } from "./Types/CanoeEnums";
import { TWagtailPage } from "./Types/PageTypes";
import { TItemListing, TPublishableItem } from "./Types/PublishableItemTypes";
import { TPublishResult } from "./Types/SyncTypes";

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
import { AF_EMPTY_TAGGED_SUBSCRIPTIONS, NOT_RELEVANT } from "./Constants";

import Logger from "./Logger";

type AfcFunction = (item: TPublishableItem) => Promise<TAppelflapResult>;

const logger = new Logger("SyncStatus");

/**
 * The App's Sync state, as a state machine
 *
 * Sync State depends on (in order of importance):
 * 1. WiFi connectivity - this can go on or off at any time 
 * 2. Injectable bundles - whether Appelflap has anything new or updated in its local store that can be injected into the cache
 * 3. Peers - whether Appelflap has anyone to share things with
 * 4. Items to Sync - a list of items that are subscribed to (all of them), and published (depends on user auth)
 * 
 * Sync Transitions are:
 * - Entering (Off -> On) - entering the Sync State, takes a snapshot of Items to Sync, starts polling WiFi connectivity and checks Injectable bundles count
 * - Exiting (On -> Off) - exiting the Sync State, stops all polling activity
 * - WiFi Off->On - starts polling Peers, in the background Appelflap will try sharing files between Peers
 * - WiFi On->Off - stops polling Peers, clears list of Peers, stops slow polling Injectable bundles count
 * - Injectable bundles 0 -> +ve - calls for Cache Injection to commence, starts a quick polling loop:
 *     - comparing the original Items to Sync snapshot with its updated state
 *     - re-checks Injectables bundles count
 * - Injectable bundles +ve -> 0 - stops quick polling Injectable bundles count, updates Items to Sync
 * - Peers list changes - restarts slow polling Injectable bundles count if it has stopped
 * 
 * Sync States:
 * - Sync Off - No Sync activity at all
 * - Sync Initialisation - Entering
 * - Sync Suspension - Exiting
 * - Syncing - Injectable bundles > 0
 * - No WiFi - WiFi off, no Injectable bundles
 * - No Peers - WiFi On, no Injectable bundles, no Peers
 * - Sync up to date - WiFi On, no Injectable bundles, Peers > 0
 * 
 * Note that there is no concept of 'Sync Completed' because you never know ...
 */
export class SyncStatus {
    //#region Implement as Singleton
    static instance: SyncStatus;
    private eTag: string;
    private itemListing: TItemListing[];
    private _syncState: "Off" | "Initialisation" | "Suspension" | "Syncing" | "NoWiFi" | "NoPeers" | "UpToDate" = "Off";
    private inTransition: boolean = false;
    private _ssid: string;

    private constructor() {
        logger.log("Singleton created");
        this.eTag = "";
        this.itemListing = [];
        this._syncState = "Off";
        this.inTransition = false;
        this._ssid = "";
    }

    public static getInstance(): SyncStatus {
        if (!SyncStatus.instance) {
            SyncStatus.instance = new SyncStatus();
        }

        return SyncStatus.instance;
    }
    //#endregion

    get ETag(): string {
        return this.eTag;
    }

    get syncState(): "Off" | "Initialisation" | "Suspension" | "Syncing" | "NoWiFi" | "NoPeers" | "UpToDate" {
        return this._syncState;
    }

    get ssid(): string {
        return this._ssid;
    }

    updateSyncStatusData<T>(statusUpdate: {name: keyof SyncStatus, source: () => any, default: any, getValue: (value: any) => T }): Promise<void> {
        if (!statusUpdate.getValue) {
            statusUpdate.getValue = (value: T) => { return value; };
        }
        let value: any;
        return statusUpdate.source()
        .then((result: any) => {
            value = result || statusUpdate.default;
        }).catch((err: any) => {
            console.warn(err);
            value = statusUpdate.default;
        }).finally(() => {
            this[-readonly statusUpdate.name] = statusUpdate.getValue(value);
            this.update();
            return Promise.resolve();
        });
    },

    async transition(): Promise<void> {
        if (this.inTransition) {
            return;
        }

        this.inTransition = true;
        switch (this._syncState) {
            case "Off":
                this._syncState = "Initialisation";
                this.itemListing = await this.BuildList();
                break;
        }
    }

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
    async GetSubscriptions(): Promise<TTaggedSubscriptions> {
        const taggedSubs = await getSubscriptions();
        if (typeof taggedSubs === "string") {
            return AF_EMPTY_TAGGED_SUBSCRIPTIONS;
        }
        this.eTag = (taggedSubs as TTaggedSubscriptions).eTag;
        logger.info(`Got Subscriptions and ETag:${this.eTag}`);
        return taggedSubs;
    }

    /** Set all current subscriptions */
    async SetSubscriptions(): Promise<TTaggedSubscriptions> {
        const itemListings = await this.ItemListings();
        logger.info(`Setting Subscriptions with ETag:${this.eTag}`);
        const taggedSubs = await setSubscriptions(this.eTag, itemListings);
        if (typeof taggedSubs === "string" && taggedSubs === "not relevant") {
            logger.warn("Could not set subscriptions ");

            return AF_EMPTY_TAGGED_SUBSCRIPTIONS;
        }
        this.eTag = (taggedSubs as TTaggedSubscriptions).eTag;
        logger.info(`Set Subscriptions and got ETag:${this.eTag}`);
        return taggedSubs as TTaggedSubscriptions;
    }
}
