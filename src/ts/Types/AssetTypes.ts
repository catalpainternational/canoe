import { TItemCommon, TPublishableItem } from "ts/Types/PublishableItemTypes";

export type TRendition = {
    /** Path to the asset rendition, a partial URL */
    path: string;
    size: number;
};

export type TAssetEntryData = {
    type: string;
    renditions: Record<string, TRendition>;
} & TItemCommon;

export type TAssetEntry = TAssetEntryData & TPublishableItem;
