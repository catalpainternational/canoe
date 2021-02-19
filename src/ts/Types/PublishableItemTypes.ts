import { TItemCacheStatus, TItemStoreStatus } from "ts/Types/CanoeEnums";

/** Describes the common fields for a manifest, page or asset item */
export type TPublishableItem = {
    version: number;
    /** The routable part of the URL (ignoring the host) */
    api_url: string;
    // Other fields
    [x: string]: any;
};

/** Describe the storage status of the manifest, page or asset item */
export type TItemStorageStatus = {
    /** What is the state of this manifest, page or asset item within the cache? */
    cacheStatus: TItemCacheStatus;

    /** What is the state of this manifest, page or asset item within the redux store? */
    storeStatus: TItemStoreStatus;
};

/** Describe the state of a manifest, page or asset item */
export type TPublishableItemState = {
    /** The storage status of this item */
    status: TItemStorageStatus;

    /** Is this manifest, page or asset item valid? */
    isValid: boolean;

    /** Is this manifest, page or asset item available offline?
     * @remarks This is used to indicate to the UI that a given item is ready for rendering
     * @returns true if all items referenced by this manifest, page or asset item are available offline as well
     */
    isAvailableOffline: boolean;

    /** Is this manifest, page or asset item complete (in itself) and ready for distribution?
     * @remarks This is used to tell Appelflap that this individual item can be shared to other devices
     * @returns true is this item itself is complete - all descendant pages and assets are in the cache
     */
    isPublishable: boolean;

    /** The fullUrl of this item that can be used to build a fetch Request object for it */
    fullUrl: string;

    /** The content type of this item that can be used to build a fetch Request object for it */
    contentType: string;

    /** The cache where this publishable item is stored */
    cache: Cache;

    /** The key to the cache where this publishable item is stored */
    cacheKey: string;
} & TPublishableItem;
