import { TPageType } from "./CanoeEnums";

export type TManifestData = {
    version: string;
    pages: Record<string, TWagtailPage>;
    // Other fields
    [x: string]: any;
};

export type TManifest = TManifestData & TManifestItemState;

export type TPageData = {
    loc_hash: string;
    storage_container: string;
    version: number;
    api_url: string;
    assets: Array<TAssetEntry>;
    language: string;
    children: Array<number>;
    depth: number;
    type: TPageType | string;
    title: string;
    // Other fields
    [x: string]: any;
};

export type TPage = TPageData & TManifestItemState;

export type TWagtailPageData = {
    id?: number;
    meta?: Record<string, any>;
    data?: Record<string, any>;
} & TPageData;

export type TWagtailPage = TWagtailPageData & TManifestItemState;

export type TAssetEntryData = {
    type: string;
    renditions: Record<string, string>;
    // Other fields
    [x: string]: any;
};

export type TAssetEntry = TAssetEntryData & TManifestItemState;

/** Describe the state of a manifest, page or asset item */
export type TManifestItemState = {
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
