import { TPublishableItemState } from "ts/Types/PublishableItemTypes";
import { TManifest } from "ts/Types/ManifestTypes";
import { TPage, TWagtailPage } from "ts/Types/PageTypes";
import { TAssetEntry } from "ts/Types/AssetTypes";

export interface IPublishableItemState extends TPublishableItemState {
    accessCache(): Promise<boolean>;
}

export interface IManifest extends TManifest, IPublishableItemState {}

export interface IPage extends TPage, IPublishableItemState {}

export interface IWagtailPage extends TWagtailPage, IPublishableItemState {}

export interface IAssetEntry extends TAssetEntry, IPublishableItemState {}
