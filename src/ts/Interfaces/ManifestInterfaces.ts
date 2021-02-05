import {
    TAssetEntry,
    TManifest,
    TManifestItemState,
    TPage,
    TWagtailPage,
} from "ts/Types/ManifestTypes";

export interface IManifestItemState extends TManifestItemState {
    accessCache(): Promise<boolean>;
}

export interface IManifest extends TManifest, IManifestItemState {}

export interface IPage extends TPage, IManifestItemState {}

export interface IWagtailPage extends TWagtailPage, IManifestItemState {}

export interface IAssetEntry extends TAssetEntry, IManifestItemState {}
