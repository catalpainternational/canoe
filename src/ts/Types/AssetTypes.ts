import { TItemCommon, TPublishableItem } from "ts/Types/PublishableItemTypes";

export type TAssetEntryData = {
    type: string;
    renditions: Record<string, string>;
} & TItemCommon;

export type TAssetEntry = TAssetEntryData & TPublishableItem;
