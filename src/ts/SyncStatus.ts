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

    private _accessGuards: Record<keyof CreateMutable<SyncStatus>, boolean>;
    private _pollerIds: Record<
        "wifi" | "peers" | "injectables" | "storage",
        number
    >;

    private _slowPoll: number;
    private _fastPoll: number;

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
        this._slowPoll = 6000;
        this._fastPoll = 600;

        this._accessGuards = {
            syncState: false,
            ssid: false,
            peerId: false,
            peers: false,
            usedStoragePercentage: false,
            injectables: false,
            itemListing: false,
            itemSubscriptions: false,
            ETag: false,
            On: false,
            Off: false,
            ItemListings: false,
            PublishAll: false,
            GetSubscriptions: false,
            SetSubscriptions: false,
            slowPoll: false,
            fastPoll: false,
        };
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

    get slowPoll(): number {
        return this._slowPoll;
    }

    set slowPoll(value: number) {
        if (this._fastPoll > 1200) {
            this._fastPoll = 1200;
        }
        if (value < this._fastPoll * 5) {
            value = this._fastPoll * 5;
        } else if (value > this._fastPoll * 50) {
            value = this._fastPoll * 50;
        }

        this._slowPoll = value;
    }

    get fastPoll(): number {
        return this._fastPoll;
    }

    set fastPoll(value: number) {
        if (this._slowPoll < 6000) {
            this._slowPoll = 6000;
        }
        if (value < this._slowPoll / 5) {
            value = this._slowPoll / 5;
        } else if (value > this._slowPoll) {
            value = this._slowPoll;
        }

        this._fastPoll = value;
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
        if (!this._accessGuards.syncState) {
            throw this.PrivateAccessorError("syncState");
        }
        this._accessGuards.syncState = false;
        this._syncState = value;
    }

    get ssid(): string {
        return this._ssid;
    }

    set ssid(value: string) {
        if (!this._accessGuards.ssid) {
            throw this.PrivateAccessorError("ssid");
        }
        this._accessGuards.ssid = false;
        this._ssid = value;
    }

    get peerId(): TPeerProperties {
        return this._peerId;
    }

    set peerId(value: TPeerProperties) {
        if (!this._accessGuards.peerId) {
            throw this.PrivateAccessorError("peerId");
        }
        this._accessGuards.peerId = false;
        this._peerId = value;
    }

    get peers(): TPeers {
        return this._peers;
    }

    set peers(value: TPeers) {
        if (!this._accessGuards.peers) {
            throw this.PrivateAccessorError("peers");
        }
        this._accessGuards.peers = false;
        this._peers = value;
    }

    get usedStoragePercentage(): number {
        return this._usedStoragePercentage;
    }

    set usedStoragePercentage(value: number) {
        if (!this._accessGuards.usedStoragePercentage) {
            throw this.PrivateAccessorError("usedStoragePercentage");
        }
        this._accessGuards.usedStoragePercentage = false;
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
        if (!this._accessGuards.injectables) {
            throw this.PrivateAccessorError("injectables");
        }
        this._accessGuards.injectables = false;
        this._injectables = value;
    }

    get itemListing(): TItemListing[] {
        return this._itemListing;
    }

    set itemListing(value: TItemListing[]) {
        if (!this._accessGuards.itemListing) {
            throw this.PrivateAccessorError("itemListing");
        }
        this._accessGuards.itemListing = false;
        this._itemListing = value;
    }

    get itemSubscriptions(): TTaggedSubscriptions {
        return this._itemSubscriptions;
    }

    set itemSubscriptions(value: TTaggedSubscriptions) {
        if (!this._accessGuards.itemSubscriptions) {
            throw this.PrivateAccessorError("itemSubscriptions");
        }
        this._accessGuards.itemSubscriptions = false;
        this._itemSubscriptions = value;
    }
    //#endregion

    private UpdateSyncStatusData<T>(
        statusUpdate: TStatusUpdate<T>
    ): Promise<void> {
        if (!statusUpdate.getValue) {
            statusUpdate.getValue = (value: T) => value;
        }
        const SetStatus = () => {
            this._accessGuards[statusUpdate.name] = true;
            /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
            // @ts-ignore TS-2540 - names are already restricted to exclude the `get` accessors
            this[statusUpdate.name] = statusUpdate.getValue(value);
            return Promise.resolve();
        };
        let value: any;
        return statusUpdate.source
            .bind(this)()
            .then((result: any) => {
                value = result || statusUpdate.default;
            })
            .catch((err: any) => {
                logger.warn(err);
                value = statusUpdate.default;
            })
            .finally(SetStatus.bind(this));
    }

    /** (Re)Starts the state transitioning */
    On(): void {
        this.Transition.bind(this)("Initialisation");
    }

    Off(): void {
        this.Transition.bind(this)("Off");
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
                transitionResult = this.TransitionToInitialisation.bind(this)();
                break;
            case "Off":
                transitionResult = this.TransitionToOff.bind(this)();
                break;
            case "Syncing":
                transitionResult = this.TransitionToSyncing.bind(this)();
                break;
            case "NoPeers":
                transitionResult = this.TransitionToNoPeers.bind(this)();
                break;
            case "NoWiFi":
                transitionResult = this.TransitionToNoWiFi.bind(this)();
                break;
            case "UpToDate":
                transitionResult = this.TransitionToUpToDate.bind(this)();
                break;
            default:
                // Unknown state to transition to - programmer error
                transitionResult = Promise.reject();
                break;
        }

        transitionResult
            .then(() => {
                this.SetSyncState.bind(this)({ syncState: this.syncState });
            })
            .catch(() => {
                // How do we want to handle failures?
            });
    }

    private async TransitionToInitialisation(): Promise<void> {
        this._nextState = "Initialisation";
        const itemListingStatusUpdate: TStatusUpdate<TItemListing[]> = {
            name: "itemListing",
            source: this.BuildList.bind(this),
            default: [],
        };
        const itemSubscriptionsStatusUpdate: TStatusUpdate<TTaggedSubscriptions> =
            {
                name: "itemSubscriptions",
                source: this.GetSubscriptions.bind(this),
                default: AF_EMPTY_TAGGED_SUBSCRIPTIONS,
            };
        const peerDataStatusUpdate: TStatusUpdate<TPeerProperties | undefined> =
            {
                name: "peerId",
                source: AppelflapUtilities.peerProperties,
                default: this.peerPropDefault,
            };
        const gotItemListing = this.UpdateSyncStatusData.bind(this)(
            itemListingStatusUpdate
        );
        const gotItemSubscriptions = this.UpdateSyncStatusData.bind(this)(
            itemSubscriptionsStatusUpdate
        );
        const gotPeerData =
            this.UpdateSyncStatusData.bind(this)(peerDataStatusUpdate);

        try {
            const transitionResults = await Promise.allSettled([
                gotItemListing,
                gotItemSubscriptions,
                gotPeerData,
            ]);
            this.PollWiFi.bind(this)();
            this.PollUsedStoragePercentage.bind(this)();
            this.RefreshPubSub.bind(this)();

            this._accessGuards.syncState = true;
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

        this._accessGuards.syncState = true;
        this.syncState = this._nextState;
        this._nextState = null;

        return await Promise.resolve();
    }

    private async TransitionToSyncing(): Promise<void> {
        this._nextState = "Syncing";

        // We set the syncState 'early', because we're going to fast poll the injectables
        this._accessGuards.syncState = true;
        this.syncState = this._nextState;

        // Switch to fast polling the injectables
        clearInterval(this._pollerIds.injectables);
        this.PollInjectables.bind(this)(this.fastPoll);

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
        this.PollInjectables.bind(this)(this.slowPoll);

        return await (result ? Promise.resolve() : Promise.reject());
    }

    private async TransitionToNoPeers(): Promise<void> {
        this._nextState = "NoPeers";

        // Stop polling the injectables
        clearInterval(this._pollerIds.injectables);
        this._pollerIds.injectables = 0;

        this._accessGuards.syncState = true;
        this.syncState = this._nextState;
        this._nextState = null;

        return await Promise.resolve();
    }

    private async TransitionToNoWiFi(): Promise<void> {
        this._nextState = "NoWiFi";

        // Switch to slow polling the injectables
        clearInterval(this._pollerIds.injectables);
        this.PollInjectables.bind(this)(this.slowPoll);

        this._accessGuards.syncState = true;
        this.syncState = this._nextState;
        this._nextState = null;

        return await Promise.resolve();
    }

    private async TransitionToUpToDate(): Promise<void> {
        this._nextState = "UpToDate";

        // Stop polling the injectables
        clearInterval(this._pollerIds.injectables);
        this._pollerIds.injectables = 0;

        this._accessGuards.syncState = true;
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
        this._pollerIds.wifi = window.setInterval(
            this.GetWiFiInfo.bind(this),
            this.slowPoll
        );
    }

    private PollUsedStoragePercentage() {
        if (this._pollerIds.storage) {
            // We're already polling
            return;
        }

        // Poll the storage every 2 seconds
        this._pollerIds.storage = window.setInterval(
            this.GetUsedStoragePercentage.bind(this),
            this.slowPoll
        );
    }

    private PollPeers() {
        if (this._pollerIds.peers) {
            // We're already polling
            return;
        }

        // Poll the list of peers every 2 seconds
        this._pollerIds.peers = window.setInterval(
            this.GetPeers.bind(this),
            this.slowPoll
        );
    }

    private PollInjectables(delay: number) {
        if (this._pollerIds.injectables) {
            // We're already polling
            return;
        }

        // Poll the list of injectables every 2 seconds
        this._pollerIds.injectables = window.setInterval(
            this.GetInjectables.bind(this),
            delay
        );
    }

    private GetWiFiInfo() {
        const wifiInfoDefault: TInfoWiFi = { network: null };
        const getSSID = (value: TInfoWiFi) => value?.network?.ssid || "";
        const statusUpdate: TStatusUpdate<string> = {
            name: "ssid",
            source: AppelflapUtilities.infoWiFi,
            default: wifiInfoDefault,
            getValue: getSSID,
        };
        const UpdateWifiInfo = () => {
            this.SetSyncState({ ssid: this.ssid });
            // On success
            if (this.ssid) {
                // Start / continue polling the list of peers
                this.PollPeers.bind(this)();
            } else {
                // Transition to NoWiFi
                this.Transition.bind(this)("NoWiFi");
            }
        };
        const updateStatusData = this.UpdateSyncStatusData.bind(this);
        updateStatusData(statusUpdate).then(UpdateWifiInfo.bind(this));
    }

    private GetUsedStoragePercentage() {
        const getValue = (value: any) => {
            const { disksize, diskfree } = value;
            return disksize ? ((disksize - diskfree) / disksize) * 100 : 0;
        };
        const statusUpdate: TStatusUpdate<number> = {
            name: "usedStoragePercentage",
            source: AppelflapUtilities.infoStorage,
            default: { disksize: 0, diskfree: 0 },
            getValue,
        };
        const UpdateUsedStoragePercentage = () => {
            this.SetSyncState.bind(this)({
                usedStoragePercentage: this.usedStoragePercentage,
            });
            // On success - we don't do anything else, yet...
        };
        const updateStatusData = this.UpdateSyncStatusData.bind(this);
        updateStatusData(statusUpdate).then(
            UpdateUsedStoragePercentage.bind(this)
        );
    }

    private GetPeers() {
        const statusUpdate: TStatusUpdate<TTaggedSubscriptions> = {
            name: "peers",
            source: AppelflapUtilities.infoPeers,
            default: [],
        };
        const UpdatePeers = () => {
            this.SetSyncState.bind(this)({ peers: this.peers });
            // On success
            if (this.peers.length) {
                // start 'slow' polling the injectable bundles
                this.PollInjectables.bind(this)(this.slowPoll);
            } else {
                // Transition to NoPeers
                this.Transition.bind(this)("NoPeers");
            }
        };
        const updateStatusData = this.UpdateSyncStatusData.bind(this);
        updateStatusData(statusUpdate).then(UpdatePeers.bind(this));
    }

    private GetInjectables() {
        const statusUpdate: TStatusUpdate<TTaggedSubscriptions> = {
            name: "injectables",
            source: CacheSubscribe.injectables,
            default: { bundles: [] } as TBundles,
        };
        const UpdateInjectables = () => {
            const bundleCount = this.injectables.bundles.length;
            this.SetSyncState.bind(this)({ bundles: bundleCount });
            // On success, time to trigger a transition depending on our current state
            let desiredState: TSyncState | null = null;
            switch (this.syncState) {
                case "Off":
                    // Do nothing, we're initialising, or we've already left
                    break;
                case "Syncing":
                    if (!bundleCount) {
                        this.RefreshPubSub.bind(this)();
                    }
                    desiredState = bundleCount ? "Syncing" : "UpToDate";
                    break;
                case "Initialisation":
                case "UpToDate":
                    desiredState = bundleCount ? "Syncing" : "UpToDate";
                    break;
                case "NoPeers":
                    desiredState = bundleCount ? "Syncing" : "NoPeers";
                    break;
                case "NoWiFi":
                    desiredState = bundleCount ? "Syncing" : "NoWiFi";
                    break;
            }
            if (desiredState) {
                this.Transition.bind(this)(desiredState);
            }
        };
        this.UpdateSyncStatusData.bind(this)(statusUpdate).then(
            UpdateInjectables.bind(this)
        );
    }

    private SetSubscribable() {
        const statusUpdate: TStatusUpdate<TTaggedSubscriptions> = {
            name: "itemSubscriptions",
            source: this.SetSubscriptions.bind(this),
            default: AF_EMPTY_TAGGED_SUBSCRIPTIONS,
        };
        this.UpdateSyncStatusData.bind(this)(statusUpdate)
            .then(() => {
                // Nothing more to do on the happy path
                // Polling Injectables tells us whether there's anything to do
            })
            .catch((err) => {
                logger.warn(`Could not set new subscriptions: ${err}`);
            });
    }

    private RefreshPubSub() {
        this.SetSubscribable.bind(this)();
        this.PublishAll.bind(this)();
    }

    async ItemListings(): Promise<TItemListing[]> {
        if (this.itemListing.length) {
            return this.itemListing;
        }

        this._accessGuards.itemListing = true;
        this.itemListing = await this.BuildList.bind(this)();
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
        itemListings.push(await this.ManifestListing.bind(this)());

        const pageIds = Object.keys(Manifest.getInstance().pages);
        const cacheKeys = await CacheKeys();

        const pageListings: TItemListing[] = [];
        for (let ix = 0; ix < pageIds.length; ix++) {
            const pageId = pageIds[ix];
            const manifestPage = Manifest.getInstance().pages[pageId];
            const inCache = cacheKeys.includes(manifestPage.storage_container);
            const pageListing = await this.PageListing.bind(this)(
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
        const performable = (await this.ItemListings.bind(this)()).filter(
            filter
        );

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
        return this.PerformAll.bind(this)(
            (listing) => listing.isPublishable,
            publishItem
        );
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
        const itemListings = await this.ItemListings.bind(this)();
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
