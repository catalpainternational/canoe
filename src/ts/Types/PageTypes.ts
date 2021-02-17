import { TPageType } from "ts/Types/CanoeEnums";
import { TItemCommon, TPublishableItem } from "ts/Types/PublishableItemTypes";
import { TAssetEntry } from "ts/Types/AssetTypes";

export type TPageData = {
    loc_hash: string;
    storage_container: string;
    assets: Array<TAssetEntry>;
    language: string;
    children: Array<string>;
    depth: number;
    type: TPageType | string;
    title: string;
} & TItemCommon;

export type TPage = TPageData & TPublishableItem;

export type TWagtailPageData = {
    meta?: Record<string, any>;
    data?: Record<string, any>;
} & TPageData;

export type TWagtailPage = TWagtailPageData & TPublishableItem;
