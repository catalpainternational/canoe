import { TItemType } from "./CanoeEnums";

/** Describes the common fields for a manifest, page or asset item */
export type TItemCommon = {
    // Other fields
    [x: string]: any;
};

/** Describe the status of this manifest, page or asset item itself */
export type TItemStatus = {
    /** Is this manifest, page or asset item valid? */
    isValid: boolean;

    /** Is this manifest or page available offline?
     * @remarks This is used to indicate to the UI that a given item is ready for rendering
     * @returns true if all items referenced by this manifest or page are available offline as well
     */
    isAvailableOffline: boolean;

    /** Is this manifest or page complete (in itself) and ready for distribution?
     * @remarks This is used to tell Appelflap that this individual item can be shared to other devices
     * @returns true is this item itself is complete - all descendant pages and assets are in the cache
     */
    isPublishable: boolean;
};

/** A convenience structure for listing the overall status of a manifest, page or asset item */
export type TItemListing = {
    title: string;
    type: TItemType;
    backendPath: string;
    cacheKey: string;
    version: number;
} & TItemStatus;

/** Describe the state of a manifest, page or asset item */
export type TPublishableItem = {
    /** The key to the cache where this publishable item is stored */
    cacheKey: string;
} & TItemStatus &
    TItemCommon;
