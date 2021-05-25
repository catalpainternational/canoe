import {
    TItemCacheStatus,
    TItemStoreStatus,
    TItemType,
} from "ts/Types/CanoeEnums";

/** The id fields for a manifest, page or asset item */
export type TItemId = {
    api_url: string;
};

/** Describes the common fields for a manifest, page or asset item */
export type TItemCommon = {
    // Other fields
    [x: string]: any;
} & TItemId;

/** Describe the storage status of the manifest, page or asset item */
export type TItemStorageStatus = {
    /** What is the state of this manifest, page or asset item within the cache? */
    cacheStatus: TItemCacheStatus;

    /** What is the state of this manifest, page or asset item within the redux store? */
    storeStatus: TItemStoreStatus;
};

/** Describe the status of this manifest, page or asset item itself */
export type TItemStatus = {
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
};

/** A convenience structure for listing the overall status of a manifest, page or asset item */
export type TItemListing = {
    title: string;
    type: TItemType;
    cacheKey: string;
    version: number;
} & TItemId &
    TItemStorageStatus &
    TItemStatus;

/** Describe the state of a manifest, page or asset item */
export type TPublishableItem = {
    /** The key to the cache where this publishable item is stored */
    cacheKey: string;
} & TItemStatus &
    TItemCommon;
