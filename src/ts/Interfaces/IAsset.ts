import { TManifestItemState } from "ts/Types/ManifestTypes";

/** Describes a single asset, its type, and where to get it */
export interface IAsset extends TManifestItemState {
    /** Where to request this asset from */
    uri: string;
    /** What type of asset, for example image or video */
    type: string;
    /** What renditions of this asset are available */
    renditions: Record<string, string>;
}
