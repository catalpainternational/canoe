import { TPageType } from "./CanoeEnums";
import { TItemCommon, TPublishableItem } from "./PublishableItemTypes";
import { TAssetEntry } from "./AssetTypes";

export type TPageData = {
    title: string;
    type: TPageType | string;
    loc_hash: string;
    storage_container: string;
    version: number;
    slug: string;
    api_url: string;
    language: string;
    children: Array<string>;
    depth: number;
    card_image: string;
    tags: Array<string>;
    revision_id: BigInteger;
    assets: Array<TAssetEntry>;
} & TItemCommon;

export type TPage = TPageData & TPublishableItem;

export type TWagtailPageData = {
    meta?: Record<string, any>;
    data?: Record<string, any>;
} & TPageData;

export type TWagtailPage = TWagtailPageData & TPublishableItem;
