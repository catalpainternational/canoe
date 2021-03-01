import { TPublishableItem } from "ts/Types/PublishableItemTypes";
import { TManifest } from "ts/Types/ManifestTypes";
import { TPage, TWagtailPage } from "ts/Types/PageTypes";
import { TAssetEntry } from "ts/Types/AssetTypes";
import { TPublication } from "ts/Types/CacheTypes";

export interface IPublishableItem extends TPublishableItem {
    accessCache(): Promise<boolean>;
    cacheTarget: TPublication;
}

export interface IManifest extends TManifest, IPublishableItem {}

export interface IPage extends TPage, IPublishableItem {}

export interface IWagtailPage extends TWagtailPage, IPublishableItem {}

export interface IAssetEntry extends TAssetEntry, IPublishableItem {}
