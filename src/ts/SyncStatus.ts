import { TBundles } from "./Types/BundleTypes";
import { TTaggedSubscriptions } from "./Types/CacheTypes";
import { TAppelflapResult } from "./Types/CanoeEnums";
import { TInfoWiFi, TPeerProperties, TPeers } from "./Types/InfoTypes";
import { TWagtailPage } from "./Types/PageTypes";
import { TItemListing, TPublishableItem } from "./Types/PublishableItemTypes";
import { TPublishResult } from "./Types/SyncTypes";
import { CreateMutable } from "./Types/Mutable";

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

import { AppelflapUtilities } from "./Appelflap/AppelflapUtilities";
import { CacheSubscribe } from "./Appelflap/CacheSubscribe";

import { AF_EMPTY_TAGGED_SUBSCRIPTIONS, NOT_RELEVANT } from "./Constants";
import Logger from "./Logger";

// See ts/Typings for the type definitions for these imports
import { setSyncState } from "ReduxImpl/Interface";

type AfcFunction = (item: TPublishableItem) => Promise<TAppelflapResult>;

type TStatusUpdate<T> = {
    name: keyof CreateMutable<SyncStatus>;
    source: () => any;
    default: any;
    getValue?: (value: any) => T;
};

type TSyncState =
    | "Off"
    | "Initialisation"
    | "Syncing"
    | "NoWiFi"
    | "NoPeers"
    | "UpToDate";

export class SyncStatusError extends Error {
    private type: string;

    constructor(type: string, ...params: any[]) {
        super(...params);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, SyncStatusError);
        }

        this.name = "SyncStatusError";
        this.type = type;
    }
}

const logger = new Logger("SyncStatus");

/**
 * The App's Sync state, as a state machine
 *
 * Sync State depends on (in order of importance):
 * 1. WiFi connectivity - this can go on or off at any time
 * 2. Injectable bundles - whether Appelflap has anything new or updated in its local store that can be injected into the cache
 * 3. Peers - whether Appelflap has anyone to share things with
 * 4. Items Subscribed - a list of items that are subscribed to (all of them) from Appelflap
 * 5. Items Published - a list of all items that are 'published' (depends on user's auth) to Appelflap
 * 6. Item Listing - a list derived from the manifest and the above subscription and publication states
 *
 * Sync Transitions are:
 * - Entering (Off -> On) - entering the Sync State,
 *     - takes a snapshot of Items Subscribed, Published and Listing
 *     - refreshes Item subscriptions and publications
 *     - starts polling WiFi connectivity
 *     - starts polling Storage space
 *     - checks Injectable bundles count
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
 * - Syncing - Injectable bundles > 0
 * - No WiFi - WiFi off, no Injectable bundles
 * - No Peers - WiFi On, no Injectable bundles, no Peers
 * - Sync up to date - WiFi On, no Injectable bundles, Peers > 0
 *
 * Notes:
 * - there is no concept of 'Sync Completed' because you never know ...
 * - Storage space is not wired up to trigger any state changes, yet ...
 */
export class SyncStatus {
    //#region Implement as Singleton
    static instance: SyncStatus;

    private _accessSyncState = false;
    private _accessInjectables = false;
    private _accessItemListing = false;
    private _accessItemSubscriptions = false;
    private _accessSSID = false;
    private _accessPeerId = false;
    private _accessPeers = false;
    private _accessUsedStoragePercentage = false;

    private _syncState: TSyncState = "Off";
    private _nextState: TSyncState | null = null;

    private eTag: string;
    private _ssid: string;
    private _peerId: TPeerProperties;
    private _peers: TPeers;
    private _injectables: TBundles;
    private _itemListing: TItemListing[];
    private _itemSubscriptions: TTaggedSubscriptions;
    private _usedStoragePercentage: number;

    private _pollerIds: Record<
        "wifi" | "peers" | "injectables" | "storage",
        number
    >;

    private peerPropDefault: TPeerProperties = {
        id: 0,
        friendly_id: "unknown",
    };

    private constructor() {
        logger.log("Singleton created");
        this.eTag = "";
        this._injectables = { bundles: [] };
        this._itemListing = [];
        this._itemSubscriptions = AF_EMPTY_TAGGED_SUBSCRIPTIONS;
        this._syncState = "Off";
        this._nextState = null;
        this._ssid = "";
        this._peerId = this.peerPropDefault;
        this._peers = [];
        this._usedStoragePercentage = 0;

        this._pollerIds = { wifi: 0, peers: 0, injectables: 0, storage: 0 };
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

    //#region Accessors - with pseudo private `set`
    private PrivateAccessorError(
        accessorName: keyof CreateMutable<SyncStatus>
    ): SyncStatusError {
        return new SyncStatusError(
            "PrivateAccessorAccess",
            `The property '${accessorName}' is not accessible outside of SyncStatus`
        );
    }

    get syncState(): TSyncState {
        return this._syncState;
    }

    set syncState(value: TSyncState) {
        if (!this._accessSyncState) {
            throw this.PrivateAccessorError("syncState");
        }
        this._accessSyncState = false;
        this._syncState = value;
    }

    get ssid(): string {
        return this._ssid;
    }

    set ssid(value: string) {
        if (!this._accessSSID) {
            throw this.PrivateAccessorError("ssid");
        }
        this._accessSSID = false;
        this._ssid = value;
    }

    get peerId(): TPeerProperties {
        return this._peerId;
    }

    set peerId(value: TPeerProperties) {
        if (!this._accessPeerId) {
            throw this.PrivateAccessorError("peerId");
        }
        this._accessPeerId = false;
        this._peerId = value;
    }

    get peers(): TPeers {
        return this._peers;
    }

    set peers(value: TPeers) {
        if (!this._accessPeers) {
            throw this.PrivateAccessorError("peers");
        }
        this._accessPeers = false;
        this._peers = value;
    }

    get usedStoragePercentage(): number {
        return this._usedStoragePercentage;
    }

    set usedStoragePercentage(value: number) {
        if (!this._accessUsedStoragePercentage) {
            throw this.PrivateAccessorError("usedStoragePercentage");
        }
        this._accessUsedStoragePercentage = false;
        if (value < 0) {
            value = 0;
        } else if (value > 100) {
            value = 100;
        }
        this._usedStoragePercentage = value;
    }

    get injectables(): TBundles {
        return this._injectables;
    }

    set injectables(value: TBundles) {
        if (!this._accessInjectables) {
            throw this.PrivateAccessorError("injectables");
        }
        this._accessInjectables = false;
        this._injectables = value;
    }

    get itemListing(): TItemListing[] {
        return this._itemListing;
    }

    set itemListing(value: TItemListing[]) {
        if (!this._accessItemListing) {
            throw this.PrivateAccessorError("itemListing");
        }
        this._accessItemListing = false;
        this._itemListing = value;
    }

    get itemSubscriptions(): TTaggedSubscriptions {
        return this._itemSubscriptions;
    }

    set itemSubscriptions(value: TTaggedSubscriptions) {
        if (!this._accessItemSubscriptions) {
            throw this.PrivateAccessorError("itemSubscriptions");
        }
        this._accessItemSubscriptions = false;
        this._itemSubscriptions = value;
    }
    //#endregion

    private updateSyncStatusData<T>(
        statusUpdate: TStatusUpdate<T>
    ): Promise<void> {
        if (!statusUpdate.getValue) {
            statusUpdate.getValue = (value: T) => value;
        }
        let value: any;
        return statusUpdate
            .source()
            .then((result: any) => {
                value = result || statusUpdate.default;
            })
            .catch((err: any) => {
                logger.warn(err);
                value = statusUpdate.default;
            })
            .finally(() => {
                /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
                // @ts-ignore TS-2540 - names are already restricted to exclude the `get` accessors
                this[statusUpdate.name] = statusUpdate.getValue(value);
                return Promise.resolve();
            });
    }

    /** (Re)Starts the state transitioning */
    On(): void {
        this.Transition("Initialisation");
    }

    Off(): void {
        this.Transition("Off");
    }

    private SetSyncState(fields: any): void {
        const currentState = {
            syncState: this.syncState,
            ssid: this.ssid,
            peerId: this.peerId,
            peers: this.peers,
            usedStoragePercentage: this.usedStoragePercentage,
            bundles: this.injectables.bundles.length,
        };
        setSyncState({ ...currentState, ...fields });
    }

    private Transition(desiredState: TSyncState): void {
        if (this._nextState) {
            // We're 'in transition'
            return;
        }

        let transitionResult: Promise<void>;
        switch (desiredState) {
            case "Initialisation":
                transitionResult = this.TransitionToInitialisation();
                break;
            case "Off":
                transitionResult = this.TransitionToOff();
                break;
            case "Syncing":
                transitionResult = this.TransitionToSyncing();
                break;
            case "NoPeers":
                transitionResult = this.TransitionToNoPeers();
                break;
            case "NoWiFi":
                transitionResult = this.TransitionToNoWiFi();
                break;
            case "UpToDate":
                transitionResult = this.TransitionToUpToDate();
                break;
            default:
                // Unknown state to transition to - programmer error
                transitionResult = Promise.reject();
                break;
        }

        transitionResult
            .then(() => {
                this.SetSyncState({ syncState: this.syncState });
            })
            .catch(() => {
                // How do we want to handle failures?
            });
    }

    private async TransitionToInitialisation(): Promise<void> {
        this._nextState = "Initialisation";
        this._accessItemListing = true;
        this._accessItemSubscriptions = true;
        this._accessPeerId = true;
        const gotItemListing = this.updateSyncStatusData({
            name: "itemListing",
            source: this.BuildList,
            default: [],
        });
        const gotItemSubscriptions = this.updateSyncStatusData({
            name: "itemSubscriptions",
            source: this.GetSubscriptions,
            default: AF_EMPTY_TAGGED_SUBSCRIPTIONS,
        });
        const gotPeerData = this.updateSyncStatusData({
            name: "peerId",
            source: AppelflapUtilities.peerProperties,
            default: this.peerPropDefault,
        });

        try {
            const transitionResults = await Promise.allSettled([
                gotItemListing,
                gotItemSubscriptions,
                gotPeerData,
            ]);
            this.PollWiFi();
            this.PollUsedStoragePercentage();
            this.RefreshPubSub();

            this._accessSyncState = true;
            this.syncState = this._nextState;
            this._nextState = null;

            return transitionResults.filter(Boolean)
                ? Promise.resolve()
                : Promise.reject();
        } catch (e) {
            // The state transition failed
            this._nextState = null;
            return await Promise.reject();
        }
    }

    private async TransitionToOff(): Promise<void> {
        this._nextState = "Off";
        // Stop all polling activity
        for (const key in this._pollerIds) {
            const pollerId = (this._pollerIds as any)[key];
            if (pollerId) {
                clearInterval(pollerId);
            }
        }

        this._accessSyncState = true;
        this.syncState = this._nextState;
        this._nextState = null;

        return await Promise.resolve();
    }

    private async TransitionToSyncing(): Promise<void> {
        this._nextState = "Syncing";

        // We set the syncState 'early', because we're going to fast poll the injectables
        this._accessSyncState = true;
        this.syncState = this._nextState;

        // Switch to fast polling the injectables
        clearInterval(this._pollerIds.injectables);
        this.PollInjectables(300);

        // Start cache injection
        let result = true;
        try {
            result = !(await AppelflapUtilities.injectCaches());
        } catch (e) {
            // The injection failed
            result = false;
        }

        this._nextState = null;
        // Switch back to slow polling
        clearInterval(this._pollerIds.injectables);
        this.PollInjectables(2000);

        return await (result ? Promise.resolve() : Promise.reject());
    }

    private async TransitionToNoPeers(): Promise<void> {
        this._nextState = "NoPeers";

        // Stop polling the injectables
        clearInterval(this._pollerIds.injectables);
        this._pollerIds.injectables = 0;

        this._accessSyncState = true;
        this.syncState = this._nextState;
        this._nextState = null;

        return await Promise.resolve();
    }

    private async TransitionToNoWiFi(): Promise<void> {
        this._nextState = "NoWiFi";

        // Switch to slow polling the injectables
        clearInterval(this._pollerIds.injectables);
        this.PollInjectables(2000);

        this._accessSyncState = true;
        this.syncState = this._nextState;
        this._nextState = null;

        return await Promise.resolve();
    }

    private async TransitionToUpToDate(): Promise<void> {
        this._nextState = "UpToDate";

        // Stop polling the injectables
        clearInterval(this._pollerIds.injectables);
        this._pollerIds.injectables = 0;

        this._accessSyncState = true;
        this.syncState = this._nextState;
        this._nextState = null;

        return await Promise.resolve();
    }

    private PollWiFi() {
        if (this._pollerIds.wifi) {
            // We're already polling
            return;
        }

        // Poll the wifi connectivity every 2 seconds
        this._pollerIds.wifi = window.setInterval(() => {
            const wifiInfoDefault: TInfoWiFi = { network: null };
            const getSSID = (value: TInfoWiFi) => value?.network?.ssid || "";
            this._accessSSID = true;
            this.updateSyncStatusData({
                name: "ssid",
                source: AppelflapUtilities.infoWiFi,
                default: wifiInfoDefault,
                getValue: getSSID,
            }).then(() => {
                this.SetSyncState({ ssid: this.ssid });
                // On success
                if (this.ssid) {
                    // Start / continue polling the list of peers
                    this.PollPeers();
                } else {
                    // Transition to NoWiFi
                    this.Transition("NoWiFi");
                }
            });
        }, 2000);
    }

    private PollUsedStoragePercentage() {
        if (this._pollerIds.storage) {
            // We're already polling
            return;
        }

        // Poll the storage every 2 seconds
        this._pollerIds.storage = window.setInterval(() => {
            this._accessUsedStoragePercentage = true;
            this.updateSyncStatusData({
                name: "usedStoragePercentage",
                source: AppelflapUtilities.infoStorage,
                default: { disksize: 0, diskfree: 0 },
                getValue: (value) => {
                    const { disksize, diskfree } = value;
                    return disksize
                        ? ((disksize - diskfree) / disksize) * 100
                        : 0;
                },
            }).then(() => {
                this.SetSyncState({
                    usedStoragePercentage: this.usedStoragePercentage,
                });
                // On success - we don't do anything else, yet...
            });
        }, 2000);
    }

    private PollPeers() {
        if (this._pollerIds.peers) {
            // We're already polling
            return;
        }

        // Poll the list of peers every 2 seconds
        this._pollerIds.peers = window.setInterval(() => {
            this._accessPeers = true;
            this.updateSyncStatusData({
                name: "peers",
                source: AppelflapUtilities.infoPeers,
                default: [],
            }).then(() => {
                this.SetSyncState({ peers: this.peers });
                // On success
                if (this.peers.length) {
                    // start 'slow' polling the injectable bundles
                    this.PollInjectables(2000);
                } else {
                    // Transition to NoPeers
                    this.Transition("NoPeers");
                }
            });
        }, 2000);
    }

    private PollInjectables(delay: number) {
        if (this._pollerIds.injectables) {
            // We're already polling
            return;
        }

        // Poll the list of injectables every 2 seconds
        this._pollerIds.injectables = window.setInterval(
            this.GetInjectables,
            delay
        );
    }

    private GetInjectables() {
        this._accessInjectables = true;
        this.updateSyncStatusData({
            name: "injectables",
            source: CacheSubscribe.injectables,
            default: { bundles: [] } as TBundles,
        }).then(() => {
            const bundleCount = this.injectables.bundles.length;
            this.SetSyncState({ bundles: bundleCount });
            // On success, time to trigger a transition depending on our current state
            switch (this.syncState) {
                case "Off":
                    // Do nothing, we're initialising, or we've already left
                    break;
                case "Syncing":
                    if (!bundleCount) {
                        this.RefreshPubSub();
                    }
                    this.Transition(bundleCount ? "Syncing" : "UpToDate");
                    break;
                case "Initialisation":
                case "UpToDate":
                    this.Transition(bundleCount ? "Syncing" : "UpToDate");
                    break;
                case "NoPeers":
                    this.Transition(bundleCount ? "Syncing" : "NoPeers");
                    break;
                case "NoWiFi":
                    this.Transition(bundleCount ? "Syncing" : "NoWiFi");
                    break;
            }
        });
    }

    private SetSubscribable() {
        this._accessItemSubscriptions = true;
        const statusUpdate: TStatusUpdate<TTaggedSubscriptions> = {
            name: "itemSubscriptions",
            source: this.SetSubscriptions,
            default: AF_EMPTY_TAGGED_SUBSCRIPTIONS,
        };
        this.updateSyncStatusData(statusUpdate)
            .then(() => {
                // Nothing more to do on the happy path
                // Polling Injectables tells us whether there's anything to do
            })
            .catch((err) => {
                logger.warn(`Could not set new subscriptions: ${err}`);
            });
    }

    private RefreshPubSub() {
        this.SetSubscribable();
        this.PublishAll();
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
