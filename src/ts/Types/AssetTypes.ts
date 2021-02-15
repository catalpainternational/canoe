import {
    TPublishableItem,
    TPublishableItemState,
} from "ts/Types/PublishableItemTypes";

export type TAssetEntryData = {
    id: string;
    type: string;
    renditions: Record<string, string>;
} & TPublishableItem;

export type TAssetEntry = TAssetEntryData & TPublishableItemState;
